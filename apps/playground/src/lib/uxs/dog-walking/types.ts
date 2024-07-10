import type {AvailabilityResponse} from "@breezbook/backend-api-types";
import type {IsoDate} from "@breezbook/packages-types";

export type AvailabilityItem = {
    date: string;
    times: string[];
};

export function availabilityResponseToItems(dates: IsoDate[], response: AvailabilityResponse): AvailabilityItem[] {
    return dates.map(d => {
        const slots = response.slots[d.value];
        if(!slots) {
            return {date: d.value, times: []};
        }
        return {date: d.value, times: slots.map(s => s.label)};
    })
}

interface JSONSchemaFieldDefinition {
    type: 'string' | 'number' | 'boolean';
    title?: string;
    description?: string;
}

export interface JSONSchema {
    $schema: string;
    type: 'object';
    properties: {
        [key: string]: JSONSchemaFieldDefinition;
    };
    required?: string[];
    additionalProperties: boolean;
}
