import {
    addOnOrder,
    carwash,
    currency,
    customer,
    environmentId,
    fullPaymentOnCheckout,
    IsoDate,
    isoDate,
    isoDateFns,
    mandatory,
    price,
    priceFns,
    randomInteger,
    tenantEnvironment,
    tenantId,
    tenantSettings,
    timezone
} from '@breezbook/packages-core';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {startTestEnvironment, stopTestEnvironment} from './setup.js';
import {StartedDockerComposeEnvironment} from 'testcontainers';
import {
    fiveDaysFromNow,
    fourDaysFromNow,
    goodCustomer,
    goodServiceFormData,
    postOrder,
    threeDaysFromNow
} from './helper.js';
import {
    AvailabilityResponse,
    CancellationGranted,
    OrderCreatedResponse,
    pricedAddOn,
    pricedBasket,
    PricedBasket,
    pricedBasketLine,
    pricedCreateOrderRequest,
    Service,
    Tenant,
    unpricedBasket,
    unpricedBasketLine,
    waitlistRegistration
} from '@breezbook/backend-api-types';
import {prismaClient} from '../src/prisma/client.js';
import {PaymentIntentWebhookBody} from '../src/stripe.js';
import {
    STRIPE_API_KEY_SECRET_NAME,
    STRIPE_PUBLIC_KEY_SECRET_NAME,
    STRIPE_WEBHOOK_ID
} from '../src/express/stripeEndpoint.js';
import {OrderPaymentCreatedResponse} from '../src/express/handleReceivedWebhook.js';
import {setSystemConfig} from '../src/prisma/setSystemConfig.js';
import {storeSystemSecret, storeTenantSecret} from '../src/infra/secretsInPostgres.js';
import {insertOrder} from "./insertOrder.js";
import {externalApiPaths} from "../src/express/expressApp.js";
import {multiLocationGym} from "../src/dx/loadMultiLocationGymTenant.js";
import {ResourceSummary} from "../src/core/resources/resources.js";
import {EverythingToCreateOrderReferenceData} from "../src/express/onAddOrderExpress.js";

/**
 * This test should contain one test case for each API endpoint, or integration scenario,
 * to make sure that the app is configured correctly.  Details of the logic of each endpoint
 * should be unit tested.
 *
 * This likely will make this file long, and disparate, but we/I took this decision to balance coverage and
 * test suite speed.  Let's see how it pans out.
 */
const expressPort = 3010;
const postgresPort = 54340;
const tenantEnv = tenantEnvironment(environmentId('dev'), tenantId('tenant1'));

describe('Given a migrated database', () => {
    let testEnvironment: StartedDockerComposeEnvironment;

    beforeAll(async () => {
        testEnvironment = await startTestEnvironment(expressPort, postgresPort, async () => {
            await setSystemConfig(tenantEnv, 'received_webhook_handler_url', `http://localhost:8001/stashWebhook`);
            await storeSystemSecret(tenantEnv.environmentId, 'internal_bb_api_key', `internal api key`, 'test-api-key');
            await storeTenantSecret(tenantEnv, STRIPE_API_KEY_SECRET_NAME, 'stripe api key', 'sk_test_something');
            await storeTenantSecret(tenantEnv, STRIPE_PUBLIC_KEY_SECRET_NAME, 'stripe public key', 'pk_test_something');
        });
    }, 1000 * 90);

    afterAll(async () => {
        await stopTestEnvironment(testEnvironment);
    });

    test('should be able to get service availability for a location', async () => {
        const fetched = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/breezbook.carwash.locations.london/service/smallCarWash.id/availability?fromDate=2023-12-20&toDate=2023-12-23`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        expect(fetched.status).toBe(200);
        const json = (await fetched.json()) as AvailabilityResponse;

        expect(json.slots['2023-12-19']).toBeUndefined();
        expect(json.slots['2023-12-20']).toHaveLength(3);
        expect(json.slots['2023-12-21']).toHaveLength(3);
        expect(json.slots['2023-12-22']).toHaveLength(3);
        expect(json.slots['2023-12-23']).toHaveLength(3);
        expect(json.slots['2023-12-24']).toBeUndefined();
    });

    test('can add an order for two car washes, each with different add-ons', async () => {
        const twoServicesPricedBasket = pricedBasket([
            pricedBasketLine(carwash.locations.london, carwash.smallCarWash.id, [pricedAddOn(carwash.wax.id, 1, carwash.wax.price)], carwash.smallCarWash.price, priceFns.add(carwash.smallCarWash.price, carwash.wax.price), fourDaysFromNow, carwash.nineToOne.slot.from, [goodServiceFormData], []),
            pricedBasketLine(carwash.locations.london, carwash.mediumCarWash.id, [pricedAddOn(carwash.wax.id, 1, carwash.wax.price), pricedAddOn(carwash.polish.id, 1, carwash.polish.price)], carwash.mediumCarWash.price, priceFns.add(carwash.mediumCarWash.price, carwash.wax.price, carwash.polish.price), fiveDaysFromNow, carwash.nineToOne.slot.from, [goodServiceFormData], [])
        ], priceFns.add(carwash.smallCarWash.price, carwash.wax.price, carwash.mediumCarWash.price, carwash.wax.price, carwash.polish.price))

        const fetched = await postOrder(
            twoServicesPricedBasket,
            goodCustomer,
            fullPaymentOnCheckout(),
            expressPort
        );
        if (!fetched.ok) {
            console.error(await fetched.text());
            throw new Error(`Failed to add order`);
        }
        const json = (await fetched.json()) as OrderCreatedResponse;
        expect(json.orderId).toBeDefined();
        expect(json.customerId).toBeDefined();
        expect(json.bookingIds.length).toBe(2);
        expect(json.orderLineIds.length).toBe(2);
    });

    test('can price a basket', async () => {
        const theBasket = unpricedBasket([
            unpricedBasketLine(carwash.mediumCarWash.id, carwash.locations.london, [addOnOrder(carwash.wax.id), addOnOrder(carwash.polish.id)], threeDaysFromNow, carwash.fourToSix.slot.from, [])
        ]);

        const fetched = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/basket/price`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(theBasket)
        });
        if (!fetched.ok) {
            console.error(await fetched.text());
        }
        expect(fetched.status).toBe(200);
        const json = (await fetched.json()) as PricedBasket;
        expect(json._type).toBe('priced.basket');
    });

    test('can get a cancellation grant for a booking in the future', async () => {
        const {bookingId, cancellationGrant} = await completeCancellationGrant();
        expect(cancellationGrant).toBeDefined();
        expect(cancellationGrant._type).toBe('cancellation.granted');
        expect(cancellationGrant.bookingId).toBe(bookingId);
        expect(cancellationGrant.cancellationId).toBeDefined();
        expect(cancellationGrant.refundPercentageAsRatio).toBe(1);
    });

    test('calls to /internal/api requires an API key in the Authorization header', async () => {
        const response = await fetch(`http://localhost:${expressPort}/internal/api/anything`);
        expect(response.status).toBe(401);
    });

    test('on receipt of a successful payment for an order, a payment record for the order is created', async () => {
        const costInPence = randomInteger(5000);
        const createOrderResponse = await insertOrder(
            tenantEnv,
            pricedCreateOrderRequest(pricedBasket([], price(costInPence, currency('GBP'))), customer('Mike', 'Hogan', 'mike7@email.com', "+14155552673"), fullPaymentOnCheckout()),
            {
                services: [],
                resources: [],
                addOns: [],
                coupons: [],
            },
            tenantSettings(timezone('Europe/London'), null)
        );
        const paymentIntentWebhook: PaymentIntentWebhookBody = {
            _type: 'stripe.payment.intent.webhook.body',
            id: 'pi_3OYX8wFTtlkGavGx0RSugobm',
            amount: costInPence,
            currency: 'gbp',
            status: 'succeeded',
            metadata: {
                _type: 'order.metadata',
                orderId: createOrderResponse.orderId,
                tenantId: tenantEnv.tenantId.value,
                environmentId: tenantEnv.environmentId.value
            }
        };
        const postResponse = await fetch(`http://localhost:${expressPort}/internal/api/dev/webhook/received`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: process.env.INTERNAL_API_KEY ?? ''
            },
            body: JSON.stringify({webhook_id: STRIPE_WEBHOOK_ID, payload: paymentIntentWebhook})
        });
        if (!postResponse.ok) {
            throw new Error(`Failed to post webhook: ${await postResponse.text()}`);
        }
        const orderPaymentCreatedResponse = (await postResponse.json()) as OrderPaymentCreatedResponse;
        expect(orderPaymentCreatedResponse._type).toBe('order.payment.created.response');
        expect(orderPaymentCreatedResponse.orderId).toBe(createOrderResponse.orderId);
        expect(orderPaymentCreatedResponse.paymentId).toBeDefined();
        const prisma = prismaClient();
        const payment = await prisma.order_payments.findUnique({where: {id: orderPaymentCreatedResponse.paymentId}});
        expect(payment).toBeDefined();
        expect(payment?.order_id).toBe(createOrderResponse.orderId);
        expect(payment?.amount_in_minor_units).toBe(costInPence);
        expect(payment?.amount_currency).toBe('gbp');
        expect(payment?.provider).toBe('Stripe');
        expect(payment?.provider_transaction_id).toBe(paymentIntentWebhook.id);
        expect(payment?.status).toBe(paymentIntentWebhook.status);
    });

    test('can check if a coupon is valid', async () => {
        const response = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/coupon/validity?couponCode=expired-20-percent-off`);
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.valid).toBe(false);
        expect(json.reason).toBe('coupon.end.date.past');
    });

    test('can list all services', async () => {
        const response = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/services`);
        expect(response.status).toBe(200);
        const json = await response.json() as Service[];
        expect(json.length).toBeGreaterThan(0);
    });

    test('can get tenant details by slug', async () => {
        const response = await fetch(`http://localhost:${expressPort}/api/dev/tenants?slug=tenant1`);
        expect(response.status).toBe(200);
        const json = await response.json() as Tenant;
        expect(json.id).toBe('tenant1');
        expect(json.locations.map(l => l.slug)).toEqual(expect.arrayContaining(['london', 'liverpool']));
        expect(json.theme).toBeDefined();
        expect(json.heading).toBeDefined();
        expect(json.description).toBeDefined();
        expect(json.services.length).toBeGreaterThan(1);
        expect(json.serviceLocations.length).toBeGreaterThan(1);
    });

    test('can post an email to the wait list', async () => {
        const body = waitlistRegistration('mike@email.com');
        const response = await fetch(`http://localhost:${expressPort}${externalApiPaths.waitlistSignup}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        expect(response.status).toBe(200);
    });

    test("can list all resources by type", async () => {
        const url = `http://localhost:${expressPort}${externalApiPaths.listResourcesByType}`
            .replace(":envId", multiLocationGym.environment_id)
            .replace(":tenantId", multiLocationGym.tenant_id)
            .replace(":location", multiLocationGym.locationHarlow)
            .replace(":type", "personal.trainer");
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.status !== 200) {
            console.error(await response.text());
        }
        const jsonResponse = await response.json() as ResourceSummary[]
        expect(jsonResponse).toHaveLength(2)
    });

    // test('incoming stripe webhooks are stashed and the webhook handler is called', async () => {
    // 	const webhookPayload = {
    // 		value: uuidV4()
    // 	};
    // 	const webhookPostResponse = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/stripe/webhook`, {
    // 		method: 'POST',
    // 		headers: {
    // 			'Content-Type': 'application/json'
    // 		},
    // 		body: JSON.stringify(webhookPayload)
    // 	});
    // 	expect(webhookPostResponse.status).toBe(202);
    // 	const json = await webhookPostResponse.json();
    // 	const postedWebhookId = json.id;
    // 	expect(postedWebhookId).toBeDefined();
    // 	const prisma = prismaClient();
    // 	const postedWebhook = await prisma.received_webhooks.findUnique({
    // 		where: {
    // 			id: postedWebhookId
    // 		}
    // 	});
    // 	expect(postedWebhook).toBeDefined();
    // 	expect(postedWebhook?.payload).toEqual(webhookPayload);
    // });

    // test('can create a stripe payment intent and get client_secret and public api key', async () => {
    // 	const theOrder = order(goodCustomer, [
    // 		orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], threeDaysFromNow, carwash.fourToSix, [goodServiceFormData])
    // 	]);
    //
    // 	const response = await postOrder(theOrder, carwash.smallCarWash.price, expressPort);
    // 	expect(response.status).toBe(200);
    // 	const orderCreatedResponse = (await response.json()) as OrderCreatedResponse;
    //
    // 	const paymentIntentResponse = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/orders/${orderCreatedResponse.orderId}/paymentIntent`, {
    // 		method: 'POST',
    // 		headers: {
    // 			'Content-Type': 'application/json'
    // 		},
    // 		body: JSON.stringify(fullPaymentOnCheckout())
    // 	});
    // 	expect(paymentIntentResponse.status).toBe(200);
    // 	const json = (await paymentIntentResponse.json()) as PaymentIntentResponse;
    // 	expect(json.clientSecret).toBeDefined();
    // 	expect(json.stripePublicKey).toBe('pk_test_something');
    // });
});

async function completeCancellationGrant() {
    const bookingId = await createBooking(isoDateFns.addDays(isoDate(), 3));
    const cancellationGrantResponse = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/booking/${bookingId}/cancellation/grant`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    expect(cancellationGrantResponse.status).toBe(201);
    const cancellationGrant = (await cancellationGrantResponse.json()) as CancellationGranted;
    return {bookingId, cancellationGrant};
}

function carwashReferenceData():EverythingToCreateOrderReferenceData {
    return {
        services: carwash.services,
        resources: carwash.resources,
        addOns: carwash.addOns,
        coupons: [carwash.coupons.expired20PercentOffCoupon, carwash.coupons.twentyPercentOffCoupon]
    }
}

async function createBooking(date: IsoDate): Promise<string> {
    const theBasket = pricedBasket([pricedBasketLine(carwash.locations.london, carwash.mediumCarWash.id, [], carwash.mediumCarWash.price, carwash.mediumCarWash.price, date, carwash.nineToOne.slot.from, [], [])], carwash.mediumCarWash.price)
    const createOrderResponse = await insertOrder(
        tenantEnv,
        pricedCreateOrderRequest(
            theBasket,
            goodCustomer,
            fullPaymentOnCheckout()
        ),
        carwashReferenceData(),
        tenantSettings(timezone('Europe/London'), null)
    );
    expect(createOrderResponse.bookingIds).toHaveLength(1);
    expect(createOrderResponse.bookingIds[0]).toBeDefined();
    return mandatory(createOrderResponse.bookingIds[0], 'Booking id is not defined');
}
