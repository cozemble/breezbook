<script lang="ts">
    import type { Service, ServiceOption } from "@breezbook/backend-api-types";

    export let service: Service | null = null;
    export let serviceOptions: ServiceOption[] = [];
    export let date: string | null = null;
    export let time: string | null = null;
    export let totalPrice: number = 0;

    function formatPrice(price: number, currency: string): string {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(price / 100);
    }
</script>

<div class="bg-base-200 p-4 rounded-lg mb-4">
    <h3 class="text-lg font-semibold mb-2">Booking Summary</h3>
    {#if service}
        <p>{service.name} - {formatPrice(service.priceWithNoDecimalPlaces, service.priceCurrency)}</p>
    {/if}
    {#if serviceOptions.length > 0}
        <ul>
            {#each serviceOptions as option}
                <li>{option.name} - {formatPrice(option.priceWithNoDecimalPlaces, option.priceCurrency)}</li>
            {/each}
        </ul>
    {/if}
    {#if date && time}
        <p>{new Date(date).toLocaleDateString()} @ {time}</p>
    {/if}
    <p class="mt-2"><strong>Total Price:</strong> {formatPrice(totalPrice, service?.priceCurrency || 'USD')}</p>
</div>