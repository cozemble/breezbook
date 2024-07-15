import {AddOnOrder, Price, PricedAddOn} from '@breezbook/packages-core';
import {ResourceRequirementOverride} from "./resourceTypes.js";
import {
    AddOnId,
    CouponCode,
    IsoDate,
    locationId,
    LocationId,
    serviceId,
    ServiceId,
    ServiceOptionRequest,
    TwentyFourHourClockTime
} from "@breezbook/packages-types";
import {PricedServiceOption} from "@breezbook/packages-core/dist/calculatePrice.js";
import {PriceBreakdown} from "./index.js";


export interface UnpricedBasketLine {
    _type: 'unpriced.basket.line';
    serviceId: ServiceId;
    options: ServiceOptionRequest[]
    locationId: LocationId;
    addOnIds: AddOnOrder[];
    date: IsoDate;
    startTime: TwentyFourHourClockTime;
    serviceFormData: unknown[];
    resourceRequirementOverrides: ResourceRequirementOverride[];
}

export interface UnpricedBasket {
    _type: 'unpriced.basket';
    lines: UnpricedBasketLine[];
    couponCode?: CouponCode;
}

export function unpricedBasket(lines: UnpricedBasketLine[], couponCode?: CouponCode): UnpricedBasket {
    return {
        _type: 'unpriced.basket',
        lines,
        couponCode
    };
}

export function unpricedBasketLine(serviceIdValue: ServiceId | string, locationIdValue: LocationId | string, addOnIds: AddOnOrder[], date: IsoDate, startTime: TwentyFourHourClockTime, serviceFormData: unknown[], resourceRequirementOverrides: ResourceRequirementOverride[] = [], options: ServiceOptionRequest[] = []): UnpricedBasketLine {
    const theServiceId = typeof serviceIdValue === 'string' ? serviceId(serviceIdValue) : serviceIdValue;
    const theLocationId = typeof locationIdValue === 'string' ? locationId(locationIdValue) : locationIdValue;
    return {
        _type: 'unpriced.basket.line',
        serviceId: theServiceId,
        locationId: theLocationId,
        addOnIds,
        options,
        date,
        startTime,
        serviceFormData,
        resourceRequirementOverrides
    };
}

export interface PricedBasketLine {
    _type: 'priced.basket.line';
    serviceId: ServiceId;
    locationId: LocationId;
    priceBreakdown: PriceBreakdown;
    date: IsoDate;
    startTime: TwentyFourHourClockTime;
    serviceFormData: unknown[];
    resourceRequirementOverrides: ResourceRequirementOverride[];
}

export interface PricedBasket {
    _type: 'priced.basket';
    lines: PricedBasketLine[];
    couponCode?: CouponCode;
    discount?: Price;
    total: Price;
}

export function pricedBasket(lines: PricedBasketLine[], total: Price, couponCode?: CouponCode, discount?: Price): PricedBasket {
    return {
        _type: 'priced.basket',
        lines,
        couponCode,
        discount,
        total
    };
}

export function pricedBasketLine(locationId: LocationId, serviceIdValue: ServiceId, priceBreakdown: PriceBreakdown, date: IsoDate,
                                 startTime: TwentyFourHourClockTime, serviceFormData: unknown[], resourceRequirementOverrides: ResourceRequirementOverride[]): PricedBasketLine {
    return {
        _type: 'priced.basket.line',
        locationId,
        serviceId: serviceIdValue,
        priceBreakdown,
        date,
        startTime,
        serviceFormData,
        resourceRequirementOverrides
    };
}


export const unpricedBasketFns = {
    getDates(unpricedBasket: UnpricedBasket): { fromDate: IsoDate; toDate: IsoDate } {
        const dates = unpricedBasket.lines.map((l) => l.date);
        const fromDate = dates.reduce((acc, curr) => (acc.value < curr.value ? acc : curr));
        const toDate = dates.reduce((acc, curr) => (acc.value > curr.value ? acc : curr));
        return {fromDate, toDate};
    }
};
