import {
    DayAndTimePeriod,
    dayAndTimePeriodFns,
    Metadata,
    resourceId,
    ResourceId,
    ResourceType
} from "@breezbook/packages-types";
import {resourcing} from "@breezbook/packages-resourcing";

export namespace configuration {

    // export interface Resource {
    //     _type: 'resource';
    //     id: ResourceId;
    //     type: ResourceType;
    //     name: string;
    //     metadata?: Metadata;
    // }
    //
    // export function resource(type: ResourceType, name: string, metadata: Metadata = {}, id = resourceId()): Resource {
    //     return {
    //         _type: 'resource',
    //         id,
    //         type,
    //         name,
    //         metadata
    //     };
    // }

    import Resource = resourcing.Resource;

    export interface AvailabilityBlock {
        _type: 'availability.block';
        when: DayAndTimePeriod;
    }

    export const availabilityBlockFns = {
        dropAvailability(when: DayAndTimePeriod, block: AvailabilityBlock): AvailabilityBlock[] {
            if (dayAndTimePeriodFns.intersects(block.when, when)) {
                const split = dayAndTimePeriodFns.splitPeriod(block.when, when)
                return split.map(dt => availabilityBlock(dt))
            }
            return [block];
        }
    }

    export function availabilityBlock(when: DayAndTimePeriod): AvailabilityBlock {
        return {
            _type: 'availability.block',
            when,
        };
    }

    export interface ResourceDayAvailability {
        resource: Resource;
        availability: AvailabilityBlock[];
    }

    export function resourceDayAvailability(resource: Resource, availability: AvailabilityBlock[]): ResourceDayAvailability {
        return {
            resource,
            availability
        };
    }

    export const resourceDayAvailabilityFns = {
        reduceToResource: (resourceDayAvailabilities: ResourceDayAvailability[], resourceId: ResourceId): ResourceDayAvailability[] => {
            return resourceDayAvailabilities.filter((rda) => rda.resource.id.value === resourceId.value);
        },
        dropAvailability(when: DayAndTimePeriod, resource: Resource, acc: ResourceDayAvailability[]): ResourceDayAvailability[] {
            return acc.map(rda => {
                if (rda.resource.id.value === resource.id.value) {
                    return {
                        ...rda,
                        availability: rda.availability.flatMap(block => availabilityBlockFns.dropAvailability(when, block))
                    }
                }
                return rda
            });
        }
    }


}