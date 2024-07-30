<script lang="ts">
    import {onMount} from "svelte";
    import type {CoreCustomerDetails} from "$lib/uxs/personal-training/journeyState";
    import type {ServiceOption} from "@breezbook/backend-api-types";
    import {
        type PricedBasket,
        type ResourceRequirementOverride,
        unpricedBasket,
        unpricedBasketLine
    } from "@breezbook/backend-api-types";
    import {backendUrl, fetchJson} from "$lib/helpers";
    import StripePaymentForm from "$lib/uxs/personal-training/StripePaymentForm.svelte";
    import {duration, isoDate, minutes, serviceOptionId, serviceOptionRequest, time24} from "@breezbook/packages-types";

    export let date: string
    export let time: string
    export let durationMinutes: number
    export let customerDetails: CoreCustomerDetails
    export let serviceId: string
    export let serviceOptions: ServiceOption[]
    export let locationId: string
    export let filledForms: any[]
    export let requirementOverrides: ResourceRequirementOverride[] = []
    export let tenantId: string
    export let environmentId: string
    let priced: PricedBasket
    let showStripe = false
    let isLoading = true

    onMount(async () => {
        const options = serviceOptions.map(o => serviceOptionRequest(serviceOptionId(o.id)))
        const basket = unpricedBasket([unpricedBasketLine(serviceId, locationId, [], isoDate(date), time24(time), duration(minutes(durationMinutes)),filledForms ?? [], requirementOverrides ?? [], options)])
        priced = await fetchJson(backendUrl(`/api/${environmentId}/${tenantId}/basket/price`), {
            method: "POST",
            body: JSON.stringify(basket)
        })
        showStripe = true
    })

    function onPaymentFormLoaded() {
        isLoading = false
    }
</script>

{#if isLoading}
    <div class="text-center">
        <div class="loading loading-spinner loading-lg text-primary"></div>
        <p class="mt-4 text-lg font-semibold">Loading Checkout Form...</p>
    </div>
{:else}
    <div class="text-center text-sm text-base-content/70">
        <p>Use test credit card 4242 4242 4242 4242</p>
        <p>Expiry can be any date in future</p>
        <p>CVC can be anything</p>
    </div>
{/if}

{#if showStripe && priced && customerDetails}
    <StripePaymentForm {tenantId}
                       {environmentId}
                       {priced}
                       customerDetails={customerDetails}
                       on:paymentFormLoaded={onPaymentFormLoaded}
                       on:prevStep
                       on:paymentComplete/>
{/if}