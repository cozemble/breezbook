<script lang="ts">
	import Icon from '@iconify/svelte';
	import checkoutStore from '$lib/stores/checkout';
	import { locationStore } from '$lib/stores/location';

	const { items } = checkoutStore.get();
	const location = locationStore.get();
	$: itemCount = $items.length;
	$: highlighted = itemCount > 0;
</script>

<a href="/{location.slug}/checkout" class="btn {highlighted && 'btn-accent'}">
	<span class="indicator">
		<!-- <Icon icon="ph:basket" class="w-6 h-6" /> -->
		<Icon icon="solar:cart-linear" class="w-6 h-6" />

		<span class="badge badge-sm aspect-square indicator-item">{itemCount}</span>
	</span>

	<span class="ml-2 hidden sm:inline"> Checkout </span>
</a>
