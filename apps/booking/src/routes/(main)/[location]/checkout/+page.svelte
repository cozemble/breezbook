<script lang="ts">
	import checkoutStore from '$lib/stores/checkout';
	import BookingSummary from '$lib/sections/checkout/BookingSummary.svelte';
	import OrderSummary from '$lib/sections/checkout/OrderSummary.svelte';
	import CouponEntry from '$lib/sections/checkout/CouponEntry.svelte';
	import Icon from '@iconify/svelte';

	import routeStore from '$lib/stores/routes';

	const routes = routeStore.get();
	const { items } = checkoutStore.get();
</script>

{#if $items.length === 0}
	<div class="rounded-box p-4 flex flex-col items-center">
		<Icon icon="solar:cart-bold" class="w-10 h-10 text-accent" />

		<p class="text-xl font-bold mt-4">Your basket is empty</p>
		<p class="">Start by adding a booking to your basket</p>
		<a href={routes.servicesList()} class="btn btn-primary btn-outline mt-4">Browse Services</a>
	</div>
{:else}
	<div class="pb-8">
		<h1 class="text-2xl font-semibold text-primary">Checkout Order</h1>
		<p>Please review your bookings before proceeding to checkout</p>
	</div>

	<!-- TODO remove or display error if the booking is taken while in cart -->
	<!-- TODO select bookings system for bulk operations (later) -->

	<div class="flex flex-col lg:flex-row md:items-start gap-4">
		<!-- bookings list -->
		<div class="rounded-box flex flex-col flex-grow gap-4 p-4 bg-base-200">
			{#if $items.length === 0}
				<span></span>
			{/if}

			{#each $items as booking, i (booking.id)}
				<BookingSummary {booking} />
			{/each}
		</div>

		<div class="flex flex-col gap-4">
			<CouponEntry />
			<OrderSummary />
		</div>
	</div>
{/if}
