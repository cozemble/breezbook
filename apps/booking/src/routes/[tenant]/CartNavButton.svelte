<script lang="ts">
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { getCartStore } from '$lib/stores/cart';
	import { tenantStore } from '$lib/stores/tenant';

	const { items } = getCartStore();
	const tenant = tenantStore.get();

	$: itemCount = $items.length;
	$: highlighted = itemCount > 0;

	// <!-- TODO refactor this to a universal function -->
	const goToCart = () => {
		goto(`/${tenant.slug}/cart`);
	};
</script>

<button class="btn {highlighted && 'btn-accent'}" on:click={goToCart}>
	<span class="indicator mr-2">
		<!-- <Icon icon="ph:basket" class="w-6 h-6" /> -->
		<Icon icon="solar:cart-linear" class="w-6 h-6" />

		<span class="badge badge-sm aspect-square indicator-item">{itemCount}</span>
	</span>

	Checkout
</button>
