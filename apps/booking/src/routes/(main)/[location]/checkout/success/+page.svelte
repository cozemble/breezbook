<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { page } from '$app/stores';
	import BookingSummary from '$lib/sections/checkout/BookingSummary.svelte';
	import PaymentBookings from '$lib/sections/checkout/payment/PaymentBookings.svelte';
	import checkoutStore from '$lib/stores/checkout';
	import notifications from '$lib/stores/notifications';
	import orderHistoryStore from '$lib/stores/orderHistory';
	import tenantStore from '$lib/stores/tenant';

	import routeStore from '$lib/stores/routes';

	const routes = routeStore.get();
	const tenant = tenantStore.get();
	const checkout = checkoutStore.get();
	const orderHistory = orderHistoryStore.get();

	$: params = $page.url.href
		.split('?')[1]
		.split('&')
		.reduce(
			(acc, curr) => {
				const [key, value] = curr.split('=');
				acc[key] = value;
				return acc;
			},
			{} as Record<string, string>
		) as {
		payment_intent: string;
		payment_intent_client_secret: string;
		redirect_status: string;
	};

	$: success = params.redirect_status === 'succeeded';

	onMount(() => {
		if (!success) return;

		checkout.clearItems();

		// const historyOrder = get(orderHistory.items).find(
		// 	(item) => item.paymentIntent === params.payment_intent
		// );
		// const checkoutOrder = get(checkout.order);

		// if (!historyOrder && !checkoutOrder) {
		// 	notifications.create({
		// 		type: 'error',
		// 		title: 'An error occurred',
		// 		description: 'We could not find your order. Please contact us for assistance.',
		// 		canUserClose: true
		// 	});

		// 	return;
		// }

		// if (!historyOrder && checkoutOrder) {
		// 	orderHistory.addItem({
		// 		order: checkoutOrder,
		// 		paymentIntent: params.payment_intent,
		// 		success: true
		// 	});

		// 	checkout.clearItems();
		// 	return;
		// }
	});
</script>

<div class="w-full flex flex-col gap-4">
	<div class="card bg-success text-success-content">
		<div class="card-body">
			<h1 class="text-4xl font-bold">Booking Successful!</h1>
			<p>You will receive an email with the details. Thank you for booking with us!</p>

			<div class="card-actions">
				<a href={routes.home()} class="btn btn-ghost mt-8">Go to home page</a>
			</div>
		</div>
	</div>

	<!-- <PaymentBookings /> -->

	<div>
		<p class="text-sm opacity-50">
			You can cancel or reschedule your booking using the email we sent you.
		</p>
		<p class="text-sm opacity-50">
			<!-- TODO mailto or contact link -->
			If you have any questions, please contact us at
			<a href={routes.contact()} class="link">{tenant.name}</a>.
		</p>
	</div>
</div>
