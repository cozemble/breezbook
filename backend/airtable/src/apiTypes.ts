import {Form} from "@breezbook/packages-core";

export interface TimeSlotAvailability {
    _type: 'time.slot.availability'
    startTime24hr: string
    endTime24hr: string
    label: string
    priceWithNoDecimalPlaces: number
    priceCurrency: string
}

export function timeSlotAvailability(startTime24hr: string, endTime24hr: string, label: string, priceWithNoDecimalPlaces: number,
                                     priceCurrency: string
): TimeSlotAvailability {
    return {
        _type: 'time.slot.availability',
        startTime24hr,
        endTime24hr,
        label,
        priceWithNoDecimalPlaces,
        priceCurrency
    }
}

export interface ExactTimeAvailability {
    _type: 'exact.time.availability'
    time24hr: string
    priceWithNoDecimalPlaces: number
    priceCurrency: string
}

export function exactTimeAvailability(time24hr: string, priceWithNoDecimalPlaces: number,
                                      priceCurrency: string
): ExactTimeAvailability {
    return {
        _type: 'exact.time.availability',
        time24hr,
        priceWithNoDecimalPlaces,
        priceCurrency
    }
}

export type Availability = TimeSlotAvailability

// export type Availability = TimeSlotAvailability | ExactTimeAvailability

export type Slots = Record<string, Availability[]>;

export interface ServiceSummary {
    id: string
    name: string
    durationMinutes: number,
    description: string,
    form?: Form,
    customerForm?: Form,
}

export interface AddOnSummary {
    id: string
    name: string
    priceWithNoDecimalPlaces: number
    priceCurrency: string
    requiresQuantity: boolean
}

export interface AvailabilityResponse {
    slots: Slots
    serviceSummary: ServiceSummary
    addOns: AddOnSummary[]
}

export function emptyAvailabilityResponse(serviceSummary: ServiceSummary, addOns: AddOnSummary[]): AvailabilityResponse {
    return {serviceSummary, slots: {}, addOns}
}

export interface OrderCreatedResponse {
    orderId: string
}