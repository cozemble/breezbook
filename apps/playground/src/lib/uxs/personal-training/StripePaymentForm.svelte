<script lang="ts">
    import {
        type OrderCreatedResponse,
        type PaymentIntentResponse,
        type PricedBasket,
        pricedCreateOrderRequest
    } from "@breezbook/backend-api-types";
    import {createEventDispatcher, onMount} from "svelte";
    import {backendUrl, fetchJson} from "$lib/helpers";
    import {Elements, PaymentElement} from 'svelte-stripe';
    import {loadStripe, type Stripe} from '@stripe/stripe-js';
    import {customer, fullPaymentOnCheckout} from "@breezbook/packages-core";
    import type {CoreCustomerDetails} from "$lib/uxs/personal-training/journeyState";
    import {translations} from "$lib/ui/stores";

    export let priced: PricedBasket
    export let customerDetails: CoreCustomerDetails
    export let tenantId: string
    export let environmentId: string
    let order: OrderCreatedResponse
    let paymentIntent: PaymentIntentResponse
    let stripe: Stripe | null = null
    let elements: any
    let processing = false
    const dispatch = createEventDispatcher()

    onMount(async () => {
        const orderRequest = pricedCreateOrderRequest(priced, customer(customerDetails.firstName, customerDetails.lastName, customerDetails.email, customerDetails.phone), fullPaymentOnCheckout())
        order = await fetchJson<OrderCreatedResponse>(backendUrl(`/api/${environmentId}/${tenantId}/orders`), {
            method: "POST",
            body: JSON.stringify(orderRequest)
        })
        paymentIntent = await fetchJson<PaymentIntentResponse>(backendUrl(`/api/${environmentId}/${tenantId}/orders/${order.orderId}/paymentIntent`), {
            method: "POST",
        })
        stripe = await loadStripe(paymentIntent.stripePublicKey)
        dispatch("paymentFormLoaded")
    })

    async function submit() {
        if (processing) {
            return
        }
        if (!stripe) {
            return console.error("Stripe not loaded")
        }

        processing = true

        const result = await stripe
            .confirmPayment({
                elements,
                redirect: 'if_required'
            })

        if (result.error) {
            alert(result.error.message)
            processing = false
        } else {
            dispatch("paymentComplete", {paymentIntent: result.paymentIntent})
            processing = false
        }
    }

    function prevStep() {
        dispatch("prevStep")
    }
</script>

{#if paymentIntent && stripe}
    <form on:submit|preventDefault={submit} class="flex flex-col">

        <Elements {stripe}>
            <Elements {stripe} clientSecret={paymentIntent.clientSecret} bind:elements>
                <PaymentElement/>
            </Elements>
        </Elements>

        <button class="btn btn-primary mt-4" disabled={processing}>
            {#if processing}
                {$translations.processingDotDotDot}
            {:else}
                {$translations.pay}
            {/if}
        </button>
        <button class="btn btn-outline mt-2" on:click={prevStep}>Back</button>
    </form>
{/if}
