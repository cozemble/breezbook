<script lang="ts">
    import type {PriceBreakdown, Service, ServiceOption} from "@breezbook/backend-api-types";

    export let service: Service | null = null;
    export let serviceOptions: ServiceOption[] = [];
    export let date: string | null = null;
    export let time: string | null = null;
    export let priceBreakdown: PriceBreakdown | null = null;

    function formatPrice(price: number, currency: string): string {
        return new Intl.NumberFormat('en-US', {style: 'currency', currency: currency}).format(price / 100);
    }

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
                {#if priceBreakdown}
                    <span class="font-medium">{formatPrice(priceBreakdown.servicePrice, service.priceCurrency)}</span>
                {/if}
            </div>
        {/if}
        {#if serviceOptions.length > 0}
            {#each serviceOptions as option}
                <div class="flex justify-between">
                    <span>{option.name}</span>
                    {#if priceBreakdown}
                        <span class="font-medium">{formatPrice(getPriceForOption(priceBreakdown, option), option.priceCurrency)}</span>
                    {/if}
                </div>
            {/each}
        {/if}
        {#if date && time}
            <div class="text-sm text-base-content/70">{formatDateWithDayOfWeek(date)} @ {time}</div>
        {/if}
        {#if priceBreakdown}
            <div class="flex justify-between pt-2 border-t border-base-300">
                <span class="font-semibold">Total Price:</span>
                <span class="font-semibold">{formatPrice(priceBreakdown.total, priceBreakdown.currency)}</span>
            </div>
        {/if}
    </div>
</div>