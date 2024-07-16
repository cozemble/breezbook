import {derived, get, type Readable, writable} from 'svelte/store';
import {H} from 'highlight.run';

import * as types from '@breezbook/packages-types';
import {addOnId} from '@breezbook/packages-types';
import * as core from '@breezbook/packages-core'
import {addOnOrder} from '@breezbook/packages-core'
import {
    type PricedBasket,
    pricedCreateOrderRequest,
    unpricedBasket,
    unpricedBasketLine
} from '@breezbook/backend-api-types';

import {createStoreContext} from '$lib/common/helpers/store';
import api from '$lib/common/api';

import {createPaymentStore} from './payment';
import {createCustomerStore} from './customer';
import notifications from '../notifications';
import tenantStore from '../tenant';
import {locationStore} from '../location';
import {localSyncedStore} from '$lib/common/helpers/stores';

const CART_STORE_CONTEXT_KEY = 'cart_store';

//

function createCheckoutStore() {
    const tenant = tenantStore.get();
    const tenantLocation = locationStore.get();

    const customerStore = createCustomerStore();
    const paymentStore = createPaymentStore();

    const items = localSyncedStore<Booking[]>('cart_items', []);

    const couponCode = writable<string | undefined>();

    const total: Readable<PricedBasket | null> = derived(
        [items, couponCode],
        ([$items, $couponCode], set) => {
            if ($items.length === 0) return set(null);

            // remove eventually
            const tNotif = notifications.create({
                title: 'Calculating total',
                description: 'Please wait...',
                type: 'loading',
                canUserClose: false
            });

            const basketItems = $items.map((item) => {
                return unpricedBasketLine(
                    types.serviceId(item.service.id),
                    types.locationId(tenantLocation.id),
                    item.extras.map((extra) => addOnOrder(addOnId(extra.id))),
                    types.isoDate(item.time.day),
                    types.time24(item.time.start),
                    [item.details]
                );
            });

            const coupon = $couponCode ? types.couponCode($couponCode) : undefined;
            const unpriced = unpricedBasket(basketItems, coupon);

            api.basket
                .pricing(tenant.slug, unpriced)
                .then((res) => set(res))
                .catch((err) => {
                    console.warn(err);

                    const noSuchCoupon = err.response.data.errorCode === 'addOrder.no.such.coupon';
                    if (noSuchCoupon) couponCode.set(undefined);

                    notifications.create({
                        title: 'Error',
                        description: err.response.data.errorMessage,
                        type: 'error',
                        duration: 4000
                    });
                })
                .finally(() => {
                    tNotif.remove();
                });
        }
    );

    // ----------------------------------------------------------------

    const addItem = (item: Omit<Booking, 'id'>) => {
        const newItem = {
            ...item,
            id: Math.random().toString(36).substring(2, 9)
        };

        items.update((prev) => [...prev, newItem]);
        return newItem;
    };

    const removeItem = (itemId: string) =>
        items.update((prev) => prev.filter((i) => i.id !== itemId));

    const clearItems = () => {
        items.set([]);
    };

    const submitOrder = async () => {
        const theTotal = get(total);
        if (!theTotal) return;

        const theCustomer = get(customerStore.customer);
        console.log({theCustomer})
        const patchedCustomer = {
            ...theCustomer,
            id: core.customerId(),
            email: types.email(theCustomer.email as unknown as string),
            phone: types.phoneNumber(theCustomer.phone as unknown as string),
        };
        console.log({patchedCustomer})

        // Identify the user on Highlight so we can track who that user is
        H.identify(patchedCustomer.email.value, {
            id: patchedCustomer.id.value,
            firstName: patchedCustomer.firstName,
            lastName: patchedCustomer.lastName,
            formData: JSON.stringify(patchedCustomer.formData)
        });

        const orderReq = pricedCreateOrderRequest(
            theTotal,
            patchedCustomer,
            core.fullPaymentOnCheckout()
        );

        paymentStore.initiatePayment(orderReq);
    };

    // ----------------------------------------------------------------

    return {
        customerStore,
        paymentStore,

        items,
        couponCode,
        // order,
        total,

        addItem,
        removeItem,
        clearItems,
        submitOrder
    };
}

//

const checkoutStore = createStoreContext(CART_STORE_CONTEXT_KEY, createCheckoutStore);

export default checkoutStore;
