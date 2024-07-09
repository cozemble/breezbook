<script lang="ts">
    import type {Service} from "@breezbook/backend-api-types";

    export let service: Service;
    export let selected: boolean;
    export let onClick: () => void;

    function formatPrice(price: number, currency: string): string {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(price / 100);
    }
</script>

<div class="card bg-base-100 shadow-xl cursor-pointer transition-all duration-300 {selected ? 'ring-2 ring-primary' : 'ring-2 ring-neutral hover:shadow-2xl'}"
     on:click={onClick}>
    <figure>
        <img src={service.image} alt={service.name}/>
    </figure>
    <div class="card-body">
        <h2 class="card-title">{service.name}</h2>
        <p>{service.description}</p>
        <div class="flex justify-between items-center mt-4">
            <span class="text-lg font-semibold">{formatPrice(service.priceWithNoDecimalPlaces, service.priceCurrency)}</span>
            <span class="text-sm">{service.durationMinutes} minutes</span>
        </div>
    </div>
</div>

<style>
    figure {
        height: 100px;
        overflow: hidden;
    }

</style>