<script lang="ts">
	import { onMount } from 'svelte';
	import { Elements, PaymentElement } from 'svelte-stripe';
	import { goto } from '$app/navigation';

	import routeStore from '$lib/stores/routes';
	import checkoutStore from '$lib/stores/checkout';

	import Loading from '$lib/components/Loading.svelte';
	import CustomerSummary from '$lib/sections/checkout/payment/CustomerSummary.svelte';
	import PaymentSummary from '$lib/sections/checkout/payment/PaymentSummary.svelte';
	import Bookings from '$lib/sections/checkout/payment/PaymentBookings.svelte';
	import notifications from '$lib/stores/notifications';
	import { browser } from '$app/environment';

	const routes = routeStore.get();
	const {
		paymentStore: { clientSecret, stripe, onSubmit, elements, loading, paymentInitiated }
	} = checkoutStore.get();

	if (!$paymentInitiated && browser) {
		console.warn('Payment has not been initiated');

		notifications.create({
			type: 'error',
			title: 'Error',
			description: 'Payment has not been initiated',
			duration: 5000
		});

		goto(routes.checkout.main());
	}
</script>

<div class="mb-10">
	<h1 class="text-2xl font-semibold text-primary">Payment</h1>
	<p>Your card details are safe and secure with us. We use Stripe to process payments.</p>
</div>

<div class="flex flex-col md:flex-row gap-4 w-full">
	<div class="flex flex-col flex-grow gap-4">
		<CustomerSummary />

		<div class="card bg-base-200">
			<div class="card-body p-4 sm:p-8">
				<h1 class="text-xl font-bold">Card Details</h1>

				{#if $loading}
					<Loading />
				{:else if $stripe && $clientSecret}
					<Elements stripe={$stripe}>
						<Elements stripe={$stripe} clientSecret={$clientSecret} bind:elements={$elements}>
							<PaymentElement />
						</Elements>
					</Elements>
				{/if}
			</div>
		</div>

		<Bookings />
	</div>

	<PaymentSummary />
</div>
