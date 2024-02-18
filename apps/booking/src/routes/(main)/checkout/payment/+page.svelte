<script lang="ts">
	import { Elements, PaymentElement } from 'svelte-stripe';
	import checkoutStore from '$lib/stores/checkout';
	import Loading from '$lib/components/Loading.svelte';
	import CustomerSummary from '$lib/sections/checkout/payment/CustomerSummary.svelte';

	const {
		paymentStore: { clientSecret, stripe, onSubmit, elements, loading }
	} = checkoutStore.get();
</script>

<div class="mb-10">
	<h1 class="text-2xl font-semibold text-primary">Payment</h1>
	<p>Your card details are safe and secure with us. We use Stripe to process payments.</p>
</div>

<div class="flex flex-col gap-4">
	<CustomerSummary />

	<div class="card max-w-xl bg-base-200">
		{#if $loading}
			<Loading />
		{:else if $stripe && $clientSecret}
			<div class="card-body">
				<Elements stripe={$stripe}>
					<form on:submit|preventDefault={onSubmit}>
						<Elements stripe={$stripe} clientSecret={$clientSecret} bind:elements={$elements}>
							<PaymentElement />
						</Elements>

						<div class="card-actions mt-4 justify-end">
							<button class="btn btn-primary">Pay</button>
						</div>
					</form>
				</Elements>
			</div>
		{/if}
	</div>
</div>
