<script lang="ts">
    import type {Service, ServiceOption} from "@breezbook/backend-api-types";

    export let service: Service | null = null;
    export let serviceOptions: ServiceOption[] = [];
    export let date: string | null = null;
    export let time: string | null = null;
    export let totalPrice: number = 0;

    function formatPrice(price: number, currency: string): string {
        return new Intl.NumberFormat('en-US', {style: 'currency', currency: currency}).format(price / 100);
    }

    function formatDateWithDayOfWeek(dateString: string): string {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
</script>

<div class="bg-base-200 p-4 rounded-lg mb-4">
    <h3 class="text-lg font-semibold mb-2">Booking Summary</h3>
    <div class="space-y-2">
        {#if service}
            <div class="flex justify-between">
                <span>{service.name}</span>
                <span class="font-medium">{formatPrice(service.priceWithNoDecimalPlaces, service.priceCurrency)}</span>
            </div>
        {/if}
        {#if serviceOptions.length > 0}
            {#each serviceOptions as option}
                <div class="flex justify-between">
                    <span>{option.name}</span>
                    <span class="font-medium">{formatPrice(option.priceWithNoDecimalPlaces, option.priceCurrency)}</span>
                </div>
            {/each}
        {/if}
        {#if date && time}
            <div class="text-sm text-gray-600">{formatDateWithDayOfWeek(date)} @ {time}</div>
        {/if}
        <div class="flex justify-between pt-2 border-t border-gray-300">
            <span class="font-semibold">Total Price:</span>
            <span class="font-semibold">{formatPrice(totalPrice, service?.priceCurrency || 'USD')}</span>
        </div>
    </div>
</div>