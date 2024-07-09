<script lang="ts">
    import {Minus, Plus} from 'lucide-svelte';
    import type {ServiceOption} from "@breezbook/backend-api-types";

    export let serviceOption: ServiceOption;
    export let selected: boolean = false;
    export let onSelect: () => void;

    function formatPrice(price: number, currency: string): string {
        return new Intl.NumberFormat('en-GB', {style: 'currency', currency: currency}).format(price / 100);
    }
</script>

<div class="card card-compact card-side bg-base-200 shadow-sm hover:shadow-md transition-all duration-300 mb-4 {selected ? 'ring-2 ring-primary' : 'ring-2 ring-neutral hover:shadow-2xl'}">
    <figure class="w-1/3">
        <img src={serviceOption.image} alt={serviceOption.name} class="object-cover h-full w-full"/>
    </figure>
    <div class="card-body w-2/3 p-4">
        <h2 class="card-title text-lg">{serviceOption.name}</h2>
        <p class="text-sm">{serviceOption.description}</p>
        <div class="flex justify-between items-center mt-2">
            <span class="text-lg font-semibold">
                {formatPrice(serviceOption.priceWithNoDecimalPlaces, serviceOption.priceCurrency)}
            </span>
            {#if serviceOption.durationMinutes > 0}
                <span class="text-sm">{serviceOption.durationMinutes} minutes</span>
            {/if}
        </div>
        <div class="card-actions justify-end mt-2">
            <button class="btn btn-primary btn-sm" on:click|stopPropagation={onSelect}>
                {#if selected}
                    <Minus size={16}/>
                    Remove
                {:else}
                    <Plus size={16}/>
                    Add
                {/if}
            </button>
        </div>
    </div>
</div>