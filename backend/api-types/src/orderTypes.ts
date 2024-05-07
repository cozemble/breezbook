import {PricedBasket, UnpricedBasket} from "./pricingTypes.js";
import {Customer, PaymentIntent} from "@breezbook/packages-core";

export interface PricedCreateOrderRequest {
    _type: 'priced.create.order.request';
    basket: PricedBasket;
    customer: Customer;
    paymentIntent: PaymentIntent;
}

export function pricedCreateOrderRequest(basket: PricedBasket, customer: Customer, paymentIntent: PaymentIntent): PricedCreateOrderRequest {
    return {
        _type: 'priced.create.order.request',
        basket,
        customer,
        paymentIntent
    };
}