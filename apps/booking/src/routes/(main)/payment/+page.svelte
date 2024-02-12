<script lang="ts">
	import { type Stripe, loadStripe, type StripeElements } from '@stripe/stripe-js';
	import { Elements, PaymentElement } from 'svelte-stripe';
	import { onMount } from 'svelte';
	import { PUBLIC_STRIPE_KEY } from '$env/static/public';
	import checkoutStore from '$lib/stores/checkout';

	let stripe: Stripe | null = null;

	const {
		paymentStore: { clientSecret }
	} = checkoutStore.get();

	let elements: StripeElements | undefined;

	onMount(async () => {
		stripe = await loadStripe(PUBLIC_STRIPE_KEY);
		console.log(stripe);
	});

	const onSubmit = async () => {
		if (!stripe || !elements) return;

		const { error } = await stripe.confirmPayment({
			elements,
			confirmParams: {
				// Make sure to change this to your payment completion page
				return_url: 'http://localhost:3000'
			}
		});

		// This point will only be reached if there is an immediate error when
		// confirming the payment. Otherwise, your customer will be redirected to
		// your `return_url`. For some payment methods like iDEAL, your customer will
		// be redirected to an intermediate site first to authorize the payment, then
		// redirected to the `return_url`.
		if (error.type === 'card_error' || error.type === 'validation_error') {
			console.error(error.message);
		} else {
			console.error('An unexpected error occurred.');
		}
	};
</script>

{#if stripe && $clientSecret}
	<Elements {stripe}>
		<form on:submit|preventDefault={onSubmit}>
			<Elements {stripe} clientSecret={$clientSecret} bind:elements>
				<PaymentElement />
			</Elements>

			<button class="btn btn-primary">Pay</button>
		</form>
	</Elements>
{/if}
