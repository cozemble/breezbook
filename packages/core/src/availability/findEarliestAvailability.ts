import {resourcing} from "@breezbook/packages-resourcing";
import {IsoDate, isoDateFns, mandatory, ResourceType, TwentyFourHourClockTime} from "@breezbook/packages-types";
import {Booking, Price, Service, serviceFns} from "../types.js";
import {availability, AvailabilityConfiguration, serviceRequest} from "../availability.js";
import {PricingRule} from "@breezbook/packages-pricing";
import {calculatePrice} from "../calculatePrice.js";
import Resource = resourcing.Resource;
import specificResource = resourcing.specificResource;

export interface EarliestAvailability {
    resource: Resource;
    earliestDate: IsoDate | null;
    earliestTime: TwentyFourHourClockTime | null;
    cheapestPrice: Price | null;
    period: { start: IsoDate, end: IsoDate }
}

export function findEarliestAvailability(
    config: AvailabilityConfiguration,
    service: Service,
    bookings: Booking[],
    resourceType: ResourceType,
    startDate: IsoDate,
    endDate: IsoDate,
    pricingRules: PricingRule[]
): EarliestAvailability[] {
    const dateRange = isoDateFns.listDays(startDate, endDate);
    const relevantResources = config.resourceAvailability
        .filter(ra => ra.resource.type.value === resourceType.value);
    const existingResourceRequirement = mandatory(service.resourceRequirements.find(r => r._type === "any.suitable.resource" && r.resourceType.value === resourceType.value), 'existingResourceRequirement');

    const results: EarliestAvailability[] = [];

    for (const resource of relevantResources) {
        const thisResourceSpecifically = specificResource(resource.resource, existingResourceRequirement.id)
        const mutatedService = serviceFns.replaceRequirement(service, existingResourceRequirement, thisResourceSpecifically);
        let earliestDate: IsoDate | null = null
        let earliestTime: TwentyFourHourClockTime | null = null
        let cheapestPrice: Price | null = null;
        for (const date of dateRange) {
            const request = serviceRequest(mutatedService, date);
            const availableSlots = availability.calculateAvailableSlots(config, bookings, request);

            if (availableSlots._type === 'success' && availableSlots.value.length > 0) {
                if (earliestDate === null || date.value < earliestDate.value) {
                    earliestDate = date;
                    earliestTime = availableSlots.value[0].startTime._type === 'timeslot.spec' ? availableSlots.value[0].startTime.slot.from : availableSlots.value[0].startTime.time;
                }
                const pricedSlots = availableSlots.value.map(slot => calculatePrice(slot, pricingRules));
                const cheapestSlot = pricedSlots.reduce((acc, slot) => {
                    if (acc === null) {
                        return slot;
                    }
                    return slot.price.amount.value < acc.price.amount.value ? slot : acc;
                });
                if (cheapestPrice === null || cheapestSlot.price.amount.value < cheapestPrice.amount.value) {
                    cheapestPrice = cheapestSlot.price;
                }

            }
        }
        results.push({
            resource: resource.resource,
            earliestDate,
            earliestTime,
            cheapestPrice,
            period: {start: startDate, end: endDate}
        });

    }
    return results
}