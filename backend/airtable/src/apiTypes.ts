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

export interface AvailabilityResponse {
    [date: string]: Availability[]
}

export function emptyAvailabilityResponse(): AvailabilityResponse {
    return {}
}