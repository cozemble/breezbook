<script lang="ts">
    import {onMount} from "svelte";
    import type {JourneyState} from "$lib/uxs/personal-training/journeyState";
    import {type PricedBasket, unpricedBasket, unpricedBasketLine} from "@breezbook/backend-api-types";
    import {mandatory, priceFns, time24} from "@breezbook/packages-core";
    import {backendUrl, fetchJson} from "$lib/helpers";
    import StripePaymentForm from "$lib/uxs/personal-training/StripePaymentForm.svelte";

    export let state: JourneyState
    let priced:PricedBasket
    let showStripe = false

    onMount(async () => {
        const date = mandatory(state.selectedSlot?.day, "selectedSlot.day")
        const time = mandatory(state.selectedSlot?.slot.startTime24hr, "selectedSlot.slot.startTime24hr")
        const basket = unpricedBasket([unpricedBasketLine(state.serviceId, state.locationId, [], date, time24(time), state.filledForms ?? [], state.requirementOverrides ?? [])])
        priced = await fetchJson(backendUrl(`/api/dev/breezbook-gym/basket/price`), {
            method: "POST",
            body: JSON.stringify(basket)
        })
    })

    function onPay() {
        showStripe = true
    }

</script>

{#if showStripe && priced && state.customerDetails}
    <StripePaymentForm {priced} customerDetails={state.customerDetails} on:paymentComplete/>
{:else if priced}
    <div>
        <h2>Payment</h2>
        <p>Price: £ {priceFns.format(priced.total)}</p>
        <button class="btn btn-primary" on:click={onPay}>Pay</button>
    </div>
{/if}