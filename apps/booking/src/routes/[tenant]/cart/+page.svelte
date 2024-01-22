<script lang="ts">
	import { getCartStore } from '$lib/stores/cart';
	import { formatPrice } from '$lib/utils';
	import BookingSummary from './BookingSummary.svelte';

	const { items } = getCartStore();

	$: total = $items.reduce((acc, item) => acc + item.calculatedPrice, 0);
</script>

<div class="pb-8">
	<h1 class="text-2xl font-semibold text-primary">Checkout Bookings</h1>
	<!-- <p>Please review your bookings before proceeding to checkout.</p> -->
</div>

<!-- TODO remove or display error if the booking is taken while in cart -->
<!-- TODO checkout and payment -->
<!-- TODO select bookings system for bulk operations (later) -->

<!-- bookings list -->
<div class="border p-4">
	{#if $items.length === 0}
		<span></span>
	{/if}

	{#each $items as booking (booking.id)}
		<BookingSummary {booking} />
	{/each}
</div>

<div class="flex justify-end">
	<div class="flex flex-col items-end p-4 bg-base-200 rounded-lg">
		<span class="text-sm font-bold text-primary mb-1">Selected Bookings ({$items.length}) </span>
		<span class="text-2xl font-bold mb-4">£ {formatPrice(total)}</span>

		<button class="btn btn-primary"> Confirm & Pay </button>
	</div>
</div>
