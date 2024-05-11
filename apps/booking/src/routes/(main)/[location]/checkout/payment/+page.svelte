<script lang="ts">
	import { Elements, PaymentElement } from 'svelte-stripe';
	import checkoutStore from '$lib/stores/checkout';
	import Loading from '$lib/components/Loading.svelte';
	import CustomerSummary from '$lib/sections/checkout/payment/CustomerSummary.svelte';
	import PaymentSummary from '$lib/sections/checkout/payment/PaymentSummary.svelte';
	import Bookings from '$lib/sections/checkout/payment/PaymentBookings.svelte';

	const {
		paymentStore: { clientSecret, stripe, onSubmit, elements, loading }
	} = checkoutStore.get();
</script>

<div class="mb-10">
	<h1 class="text-2xl font-semibold text-primary">Payment</h1>
	<p>Your card details are safe and secure with us. We use Stripe to process payments.</p>
</div>

<div class="flex flex-col md:flex-row gap-4 w-full">
	<div class="flex flex-col flex-grow gap-4">
		<CustomerSummary />

		<div class="card bg-base-200">
			{#if $loading}
				<Loading />
			{:else if $stripe && $clientSecret}
				<div class="card-body p-4 sm:p-8" data-mouseflow-exclude>
					<h1 class="text-xl font-bold">Card Details</h1>

					<Elements stripe={$stripe}>
						<Elements stripe={$stripe} clientSecret={$clientSecret} bind:elements={$elements}>
							<PaymentElement />
						</Elements>
					</Elements>
				</div>
			{/if}
		</div>

		<Bookings />
	</div>

	<PaymentSummary />
</div>
