import {AddOnOrder, Price, Service} from '@breezbook/packages-core';
import {ResourceRequirementOverride} from "./resourceTypes.js";
import {
    AddOnId,
    CouponCode,
    IsoDate,
    locationId,
    LocationId,
    mandatory,
    Minutes,
    serviceId,
    ServiceId, ServiceOptionRequest,
    time24Fns,
    timePeriod,
    TimePeriod,
    TwentyFourHourClockTime
} from "@breezbook/packages-types";


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

export interface PricedAddOn {
    addOnId: AddOnId;
    quantity: number;
    price: Price;
}

export interface PricedBasketLine {
    _type: 'priced.basket.line';
    serviceId: ServiceId;
    locationId: LocationId;
    addOnIds: PricedAddOn[];
    servicePrice: Price;
    total: Price;
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

export const pricedBasketLineFns = {
    bookingPeriod(line: PricedBasketLine, bookingDuration: Minutes): TimePeriod {
        return timePeriod(line.startTime, time24Fns.addMinutes(line.startTime, bookingDuration));
    },
    findService(services: Service[], serviceId: ServiceId): Service {
        return mandatory(services.find((s) => s.id.value === serviceId.value), `Service ${serviceId.value} not found`);
    }
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

export function pricedBasketLine(locationId: LocationId, serviceIdValue: ServiceId, addOnIds: PricedAddOn[], servicePrice: Price, total: Price, date: IsoDate,
                                 startTime: TwentyFourHourClockTime, serviceFormData: unknown[], resourceRequirementOverrides: ResourceRequirementOverride[]): PricedBasketLine {
    return {
        _type: 'priced.basket.line',
        locationId,
        serviceId: serviceIdValue,
        addOnIds,
        total,
        servicePrice,
        date,
        startTime,
        serviceFormData,
        resourceRequirementOverrides
    };
}

export function pricedAddOn(addOnId: AddOnId, quantity: number, price: Price): PricedAddOn {
    return {
        addOnId,
        quantity,
        price
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

export const pricedBasketFns = {
    toUnpricedBasket(pricedBasket: PricedBasket): UnpricedBasket {
        return unpricedBasket(pricedBasket.lines.map((line) => {
            return unpricedBasketLine(line.serviceId, line.locationId, line.addOnIds, line.date, line.startTime, line.serviceFormData);
        }), pricedBasket.couponCode);
    }
};
