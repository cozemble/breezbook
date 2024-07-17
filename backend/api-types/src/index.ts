import {
    Form,
    FormId,
    IsoDate,
    JsonSchemaFormLabels,
    mandatory,
    resourceId,
    ResourceId,
    resourceRequirementId,
    ResourceRequirementId,
    resourceType,
    ResourceType
} from '@breezbook/packages-types';
import {BookingIsInThePast} from '@breezbook/packages-core/dist/cancellation.js';
import {v4 as uuidv4} from 'uuid';
import {AddOnLabels} from "@breezbook/packages-core";

export * from './secrets.js';
export * from './pricingTypes.js';
export * from './orderTypes.js';

export interface PriceBreakdown {
    total: number
    currency: string
    servicePrice: number
    pricedAddOns: {
        addOnId: string
        unitPrice: number
        quantity: number
        price: number
    }[]
    pricedOptions: {
        serviceOptionId: string
        unitPrice: number
        quantity: number
        price: number
    }[]
}

export function priceBreakdown(
    total: number,
    currency: string,
    servicePrice: number,
    pricedAddOns: { addOnId: string, unitPrice: number, quantity: number, price: number }[],
    pricedOptions: { serviceOptionId: string, unitPrice: number, quantity: number, price: number }[]
): PriceBreakdown {
    return {total, currency, servicePrice, pricedAddOns, pricedOptions};
}

export interface TimeSlotAvailability {
    _type: 'time.slot.availability';
    timeslotId: string;
    date: string;
    startTime24hr: string;
    endTime24hr: string;
    label: string;
    priceWithNoDecimalPlaces: number;
    priceCurrency: string;
    priceBreakdown: PriceBreakdown
}

export function timeSlotAvailability(
    timeslotId: string,
    date: string,
    startTime24hr: string,
    endTime24hr: string,
    label: string,
    priceWithNoDecimalPlaces: number,
    priceCurrency: string,
    priceBreakdown: PriceBreakdown
): TimeSlotAvailability {
    return {
        _type: 'time.slot.availability',
        timeslotId,
        date,
        startTime24hr,
        endTime24hr,
        label,
        priceWithNoDecimalPlaces,
        priceCurrency,
        priceBreakdown
    };
}

export type Availability = TimeSlotAvailability;

export type Slots = Record<string, Availability[]>;

export interface ServiceSummary {
    id: string;
}

export interface AddOnSummary {
    id: string;
    priceWithNoDecimalPlaces: number;
    priceCurrency: string;
    requiresQuantity: boolean;
    labels: AddOnLabels | null
}

export interface AvailabilityResponse {
    _type: 'availability.response';
    slots: Slots;
    serviceId: string;
}

export const availabilityResponseFns = {
    slotsForDate(availabilityWithTwoExtras: AvailabilityResponse, date: IsoDate): Availability[] {
        return mandatory(availabilityWithTwoExtras.slots[date.value], `No slots for date ${date.value}`);
    }
}

export function emptyAvailabilityResponse(serviceId: string): AvailabilityResponse {
    return {_type: 'availability.response', serviceId, slots: {}};
}

export interface OrderCreatedResponse {
    _type: 'order.created.response';
    orderId: string;
    customerId: string;
    bookingIds: string[];
    reservationIds: string[];
    orderLineIds: string[];
}

export function orderCreatedResponse(
    orderId: string,
    customerId: string,
    bookingIds: string[],
    reservationIds: string[],
    orderLineIds: string[]
): OrderCreatedResponse {
    return {_type: 'order.created.response', orderId, customerId, bookingIds, reservationIds, orderLineIds};
}

export interface ErrorResponse {
    _type: 'error.response';
    errorCode: string;
    errorMessage?: string;
}

export function errorResponse(errorCode: string, errorMessage?: string): ErrorResponse {
    return {_type: 'error.response', errorCode, errorMessage};
}

export interface PaymentIntentResponse {
    stripePublicKey: string;
    clientSecret: string;
}

export interface CancellationGranted {
    _type: 'cancellation.granted';
    cancellationId: string;
    bookingId: string;
    refundPercentageAsRatio: number;
    hoursBeforeBookingStart: number | null;
}

export function cancellationGranted(
    refundPercentageAsRatio: number,
    hoursBeforeBookingStart: number | null,
    bookingId: string,
    cancellationId = uuidv4()
): CancellationGranted {
    return {_type: 'cancellation.granted', bookingId, cancellationId, refundPercentageAsRatio, hoursBeforeBookingStart};
}

export type CancellationGrantResponse = CancellationGranted | BookingIsInThePast;

export type ResourceRequirementSpec = AnySuitableResourceSpec | SpecificResourceSpec;

export interface AnySuitableResourceSpec {
    _type: 'any.suitable.resource.spec';
    id: ResourceRequirementId
    resourceType: ResourceType
}

export interface SpecificResourceSpec {
    _type: 'specific.resource.spec';
    id: ResourceRequirementId
    resourceId: ResourceId
}

export function anySuitableResourceSpec(id: string, rt: string): AnySuitableResourceSpec {
    return {_type: 'any.suitable.resource.spec', id: resourceRequirementId(id), resourceType: resourceType(rt)};
}

export function specificResourceSpec(id: string, rid: string): SpecificResourceSpec {
    return {_type: 'specific.resource.spec', id: resourceRequirementId(id), resourceId: resourceId(rid)};
}

export interface ServiceOption {
    id: string;
    name: string;
    description: string;
    image: string;
    priceWithNoDecimalPlaces: number;
    priceCurrency: string;
    durationMinutes: number;
    resourceRequirements: ResourceRequirementSpec[]
    requiresQuantity: boolean;
    forms: FormId[]
}

export interface Service {
    id: string;
    slug: string;
    name: string;
    description: string;
    priceWithNoDecimalPlaces: number;
    priceCurrency: string;
    hasDynamicPricing: boolean;
    durationMinutes: number;
    image: string;
    resourceRequirements: ResourceRequirementSpec[]
    serviceOptions: ServiceOption[]
    addOns: AddOnSummary[]
    forms: FormId[]
}

export interface Location {
    id: string;
    slug: string;
    name: string;
}

export interface ServiceLocation {
    serviceId: string;
    locationId: string;
}

export interface FormAndLabels {
    form: Form;
    labels: JsonSchemaFormLabels;
}

export interface Tenant {
    id: string;
    slug: string;
    name: string;
    heading: string;
    description: string;
    heroImage: string;
    locations: Location[];
    services: Service[];
    serviceLocations: ServiceLocation[]
    theme: unknown;
    customerForm: Form | null;
    forms: FormAndLabels[];
}

export * from './waitlistRegistration.js'

export * from './resourceTypes.js'

export * from './domainToApi.js'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace api {
    interface RequirementOverride {
        requirementId: string;
        resourceId: string;
    }

    interface ServiceOptionRequest {
        serviceOptionId: string;
        quantity: number;
    }

    interface AddOnOrder {
        addOnId: string;
        quantity: number;
    }

    export interface ServiceAvailabilityOptions {
        requirementOverrides: RequirementOverride[]
        serviceOptionRequests: ServiceOptionRequest[]
        addOns: AddOnOrder[]
    }

    export function isServiceAvailabilityOptions(obj: any): obj is ServiceAvailabilityOptions {
        return 'requirementOverrides' in obj && 'serviceOptionRequests' in obj && 'addOns' in obj;
    }

    export function serviceAvailabilityOptions(addOns: AddOnOrder[] = [], requirementOverrides: RequirementOverride[] = [], serviceOptionRequests: ServiceOptionRequest[] = []): ServiceAvailabilityOptions {
        return {
            requirementOverrides,
            serviceOptionRequests,
            addOns
        };
    }

}