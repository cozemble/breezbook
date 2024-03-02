<script lang="ts">
	import checkoutStore from '$lib/stores/checkout';
	import BookingSummary from '$lib/sections/checkout/BookingSummary.svelte';
	import OrderSummary from '$lib/sections/checkout/OrderSummary.svelte';
	import CouponEntry from '$lib/sections/checkout/CouponEntry.svelte';
	import MikeTestingBasketPricingEndpoint from './MikeTestingBasketPricingEndpoint.svelte';

	const { items } = checkoutStore.get();

	$: {
		console.log($items);
	}
</script>

<div class="pb-8">
	<h1 class="text-2xl font-semibold text-primary">Checkout Order</h1>
	<p>Please review your bookings before proceeding to checkout</p>
</div>

<!-- TODO remove or display error if the booking is taken while in cart -->
<!-- TODO checkout and payment -->
<!-- TODO select bookings system for bulk operations (later) -->

<div class="flex flex-col md:flex-row md:items-start gap-4">
	<!-- bookings list -->
	<div class="rounded-box flex flex-col flex-grow gap-4 p-4 bg-base-200">
		{#if $items.length === 0}
			<span></span>
		{/if}

		{#each $items as booking, i (booking.id)}
			<BookingSummary {booking} />

			<!-- {#if $items.length !== i + 1}
			<hr />
		{/if} -->
		{/each}
	</div>

	<div class="flex flex-col gap-4">
		<CouponEntry />
		<OrderSummary />
	</div>
</div>

<MikeTestingBasketPricingEndpoint />