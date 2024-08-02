<script lang="ts">
    import {Calendar, CreditCard, User} from "lucide-svelte";
    import {currencies, price, priceFns} from "@breezbook/packages-core";

    export let trainerName: string | null = null
    export let date: string | null = null
    export let time: string | null = null
    export let priceWithNoDecimalPlaces: number | null = null

    $: cost = priceWithNoDecimalPlaces ? `£${priceFns.format(price(priceWithNoDecimalPlaces, currencies.GBP))}` : null
</script>

{#if trainerName || date || time || cost}
    <div class="card bg-base-200 shadow-xl mb-4">
        <div class="card-body p-4">
            <h3 class="card-title text-lg mb-2">Booking Summary</h3>
            <ul class="space-y-2">
                <li class="flex items-center">
                    <User/>
                    <span class="ml-2">{trainerName}</span>
                </li>
                {#if date && time}
                    <li class="flex items-center">
                        <Calendar/>
                        <span class="ml-2">{date} @ {time}</span>
                    </li>
                {/if}
                {#if cost}
                    <li class="flex items-center">
                        <CreditCard/>
                        <span class="ml-2">{cost}</span>
                    </li>
                {/if}
            </ul>
        </div>
    </div>
{/if}