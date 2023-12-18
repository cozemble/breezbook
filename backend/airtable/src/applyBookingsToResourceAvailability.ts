import {mandatory} from "./utils.js";
import {Booking, calcBookingPeriod, dayAndTimePeriodFns, ResourceDayAvailability, Service, values} from "./types.js";

export function applyBookingsToResourceAvailability(resourceAvailability: ResourceDayAvailability[], bookings: Booking[], services: Service[]): ResourceDayAvailability[] {
    return bookings.reduce((resourceAvailability, booking) => {
        const service = mandatory(services.find(s => values.isEqual(s.id, booking.serviceId)), `Service with id ${booking.serviceId.value} not found`);
        const bookingPeriod = calcBookingPeriod(booking, service.duration);
        const firstSuitableResources = service.resourceTypes.map(rt => {
            const availableResources = resourceAvailability.filter(ra => ra.resource.type.value === rt.value);
            const availableResource = availableResources.find(ra => ra.availability.some(da => dayAndTimePeriodFns.overlaps(da, bookingPeriod)));
            if (!availableResource) {
                throw new Error(`No resource of type '${rt.value}' available for booking ${booking.id.value}`);
            }
            return availableResource;
        })
        return resourceAvailability.map(ra => {
            if (firstSuitableResources.find(r => values.isEqual(r.resource.id, ra.resource.id))) {
                return {
                    ...ra,
                    availability: ra.availability.flatMap(da => dayAndTimePeriodFns.splitPeriod(da, bookingPeriod))
                }
            }
            return ra;
        })
    }, resourceAvailability);
}