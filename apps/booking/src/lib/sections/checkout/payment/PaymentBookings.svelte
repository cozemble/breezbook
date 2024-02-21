<script lang="ts">
	import checkoutStore from '$lib/stores/checkout';
	import BookingSummary from './PaymentBookingSummary.svelte';

	const { items } = checkoutStore.get();
</script>

<div class="card bg-base-200">
	<ul class="card-body flex flex-col">
		<h1 class="text-xl font-bold mb-2">Bookings</h1>

		{#each $items as item}
			<li>
				<BookingSummary booking={item} />
			</li>
		{/each}
	</ul>
</div>
