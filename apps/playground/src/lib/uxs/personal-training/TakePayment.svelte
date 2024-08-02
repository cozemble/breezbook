<script lang="ts">
    import {createEventDispatcher, onMount} from "svelte";
    import type {JourneyState} from "$lib/uxs/personal-training/journeyState";
    import {type PricedBasket, unpricedBasket, unpricedBasketLine} from "@breezbook/backend-api-types";
    import {mandatory, priceFns} from "@breezbook/packages-core";
    import {backendUrl, fetchJson} from "$lib/helpers";
    import StripePaymentForm from "$lib/uxs/personal-training/StripePaymentForm.svelte";
    import {duration, minutes, time24} from "@breezbook/packages-types";
    import {translations} from "$lib/ui/stores";
    import {env, tenantId} from "$lib/uxs/personal-training/constants";
    import {ChevronLeft} from "lucide-svelte";

    export let state: JourneyState
    let priced: PricedBasket
    let showStripe = false
    const dispatch = createEventDispatcher()

    onMount(async () => {
        const date = mandatory(state.selectedSlot?.day, "selectedSlot.day")
        const time = mandatory(state.selectedSlot?.slot.startTime24hr, "selectedSlot.slot.startTime24hr")
        const service = mandatory(state.tenant.services.find(s => s.id === state.serviceId), "service")
        const basket = unpricedBasket([unpricedBasketLine(state.serviceId, state.locationId, [], date, time24(time), duration(minutes(service.durationMinutes)),state.filledForms ?? [], state.requirementOverrides ?? [])])
        console.log({basket})
        priced = await fetchJson(backendUrl(`/api/dev/breezbook-gym/basket/price`), {
            method: "POST",
            body: JSON.stringify(basket)
        })
    })

    function onPay() {
        showStripe = true
    }

    function onBack() {
        dispatch("back")
    }
</script>

{#if showStripe && priced && state.customerDetails}
    <div>
        <StripePaymentForm {priced}
                           customerDetails={state.customerDetails}
                           {tenantId}
                           environmentId={env}
                           on:paymentComplete/>
    </div>
{:else if priced}
    <div>

        <div class="mt-6 flex">
            <button on:click={onBack} class="btn mr-6">
                <ChevronLeft size={28}/>
            </button>

            <div class="flex justify-end w-full">
                <button class="btn btn-primary w-5/6" on:click={onPay}>{$translations.pay}</button>
            </div>
        </div>

    </div>
{/if}