import {DayAndTimePeriod, ResourceId, ServiceId} from "@breezbook/packages-types";
import {resourcing} from "@breezbook/packages-resourcing";

export namespace configuration {

    import Resource = resourcing.Resource;

    export interface AvailabilityBlock {
        _type: 'availability.block';
        when: DayAndTimePeriod;
    }

    export function availabilityBlock(when: DayAndTimePeriod): AvailabilityBlock {
        return {
            _type: 'availability.block',
            when,
        };
    }

    export interface ResourceAvailability {
        resource: Resource;
        availability: AvailabilityBlock[];
    }

    export function resourceAvailability(resource: Resource, availability: AvailabilityBlock[]): ResourceAvailability {
        return {
            resource,
            availability
        };
    }

    export const resourceAvailabilityFns = {
        reduceToResource: (resourceDayAvailabilities: ResourceAvailability[], resourceId: ResourceId): ResourceAvailability[] => {
            return resourceDayAvailabilities.filter((rda) => rda.resource.id.value === resourceId.value);
        }
    }

    export interface ServiceAvailability {
        serviceId: ServiceId
        availability: AvailabilityBlock[];
    }

    export function serviceAvailability(serviceId: ServiceId, availability: AvailabilityBlock[]): ServiceAvailability {
        return {
            serviceId,
            availability
        };
    }
}