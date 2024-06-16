import {
    AddOnId,
    AddOnOrder,
    CouponCode,
    IsoDate,
    locationId,
    LocationId,
    mandatory,
    Minutes,
    Price, ResourceId, ResourceRequirementId,
    Service,
    serviceId,
    ServiceId,
    time24Fns,
    TimePeriod,
    timePeriod,
    TwentyFourHourClockTime
} from '@breezbook/packages-core';

export interface UnpricedBasketLine {
    _type: 'unpriced.basket.line';
    serviceId: ServiceId;
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

export interface ResourceRequirementOverride {
    resourceRequirementId: ResourceRequirementId;
    resourceId: ResourceId;
}

export function resourceRequirementOverride(resourceRequirementId: ResourceRequirementId, resourceId: ResourceId): ResourceRequirementOverride {
    return {
        resourceRequirementId,
        resourceId
    };
}

export function unpricedBasketLine(serviceIdValue: ServiceId | string, locationIdValue: LocationId | string, addOnIds: AddOnOrder[], date: IsoDate, startTime: TwentyFourHourClockTime, serviceFormData: unknown[], resourceRequirementOverrides:ResourceRequirementOverride[] = []): UnpricedBasketLine {
    const theServiceId = typeof serviceIdValue === 'string' ? serviceId(serviceIdValue) : serviceIdValue;
    const theLocationId = typeof locationIdValue === 'string' ? locationId(locationIdValue) : locationIdValue;
    return {
        _type: 'unpriced.basket.line',
        serviceId: theServiceId,
        locationId: theLocationId,
        addOnIds,
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
                                 startTime: TwentyFourHourClockTime, serviceFormData: unknown[]
): PricedBasketLine {
    return {
        _type: 'priced.basket.line',
        locationId,
        serviceId: serviceIdValue,
        addOnIds,
        total,
        servicePrice,
        date,
        startTime,
        serviceFormData
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
