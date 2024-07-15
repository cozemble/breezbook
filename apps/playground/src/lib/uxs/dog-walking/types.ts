import type {AvailabilityResponse} from "@breezbook/backend-api-types";
import type {IsoDate} from "@breezbook/packages-types";

export type AvailabilityItem = {
    date: string;
    times: string[];
};

export function availabilityResponseToItems(dates: IsoDate[], response: AvailabilityResponse): AvailabilityItem[] {
    return dates.map(d => {
        const slots = response.slots[d.value];
        if (!slots) {
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

export function formatPrice(price: number, currency: string): string {
    const formatted = new Intl.NumberFormat('en-US', {style: 'currency', currency: currency}).format(price / 100);
    if (formatted.endsWith('.00')) {
        return formatted.slice(0, -3);
    }
    return formatted;
}
