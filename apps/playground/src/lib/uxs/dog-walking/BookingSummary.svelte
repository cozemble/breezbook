<script lang="ts">
    import type {
        Availability,
        PriceBreakdown,
        Service,
        ServiceLocation,
        ServiceOption
    } from '@breezbook/backend-api-types';
    import {formatPrice} from "./types.js";

    export let service: Service | null = null;
    export let serviceOptions: ServiceOption[] = [];
    export let slot: Availability | null = null;

    function formatDateWithDayOfWeek(dateString: string): string {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
        return date.toLocaleDateString('en-US', options);
    }

    function getPriceForOption(priceBreakdown: PriceBreakdown, option: ServiceOption): number {
        return priceBreakdown.pricedOptions.find(p => p.serviceOptionId === option.id)?.price || 0;
    }
</script>

<div class="bg-base-200 p-4 rounded-lg mb-4">
    <h3 class="text-lg font-semibold mb-2">Booking Summary</h3>
    <div class="space-y-2">
        {#if service}
            <div class="flex justify-between">
                <span>{service.name}</span>
                {#if slot?.priceBreakdown}
                    <span class="font-medium">{formatPrice(slot.priceBreakdown.servicePrice, "GBP")}</span>
                {/if}
            </div>
        {/if}
        {#if serviceOptions.length > 0}
            {#each serviceOptions as option}
                <div class="flex justify-between">
                    <span>{option.name}</span>
                    {#if slot?.priceBreakdown}
                        <span class="font-medium">{formatPrice(getPriceForOption(slot.priceBreakdown, option), option.priceCurrency)}</span>
                    {/if}
                </div>
            {/each}
        {/if}
        {#if slot}
            <div class="text-sm text-base-content/70">{formatDateWithDayOfWeek(slot.date)} @ {slot.startTime24hr}</div>
        {/if}
        {#if slot?.priceBreakdown}
            <div class="flex justify-between pt-2 border-t border-base-300">
                <span class="font-semibold">Total Price:</span>
                <span class="font-semibold">{formatPrice(slot?.priceBreakdown.total, slot?.priceBreakdown.currency)}</span>
            </div>
        {/if}
    </div>
</div>