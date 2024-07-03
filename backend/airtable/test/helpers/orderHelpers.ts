import {Coupon, Customer, fullPaymentOnCheckout, Price, priceFns, Service,} from "@breezbook/packages-core";
import {
    everythingToCreateOrder,
    EverythingToCreateOrder,
    hydratedBasket,
    hydratedBasketLine
} from "../../src/express/onAddOrderExpress.js";
import {goodCustomer, goodServiceFormData, today} from "../helper.js";
import {IsoDate, LocationId, TwentyFourHourClockTime} from "@breezbook/packages-types";

export function orderForService(service: Service, location: LocationId, startTime: TwentyFourHourClockTime): EverythingToCreateOrder {
    const basket = hydratedBasket([
        hydratedBasketLine(service, location, [], service.price, service.price, today, startTime, [goodServiceFormData])
    ])
    return everythingToCreateOrder(basket, goodCustomer, fullPaymentOnCheckout())
}

export function setCustomer(order: EverythingToCreateOrder, customer: Customer): EverythingToCreateOrder {
    return {...order, customer: customer};
}

export function setServiceForm(order: EverythingToCreateOrder, serviceForm: unknown[], lineId = 0): EverythingToCreateOrder {
    return {
        ...order,
        basket: {
            ...order.basket,
            lines: order.basket.lines.map((line, index) => index === lineId ? {
                ...line,
                serviceFormData: serviceForm
            } : line)
        }
    };
}

export function setBasketTotal(order: EverythingToCreateOrder, price1: Price) {
    return {...order, basket: {...order.basket, total: price1}};
}

export function setCoupon(order: EverythingToCreateOrder, coupon: Coupon): EverythingToCreateOrder {
    return {...order, basket: {...order.basket, coupon: coupon}};
}

export function adjustServiceToDynamicPricingForToday(service: Service) {
    const pricedAdjustedByDynamicPricing = priceFns.multiply(service.price, 1.4)
    return {...service, price: pricedAdjustedByDynamicPricing};
}

export function setDate(order: EverythingToCreateOrder, date: IsoDate): EverythingToCreateOrder {
    return {...order, basket: {...order.basket, lines: order.basket.lines.map((line) => ({...line, date}))}};
}


