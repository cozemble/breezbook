<script lang="ts">
	import { tenantStore } from '$lib/stores/tenant';
	import CartNavButton from './CartNavButton.svelte';

	const tenant = tenantStore.get();
</script>

<header class="navbar px-3 md:px-6 flex border-b sticky top-0 left-0 right-0 z-50">
	<div class="flex-1">
		<a href="/{tenant.slug}" class="text-xl font-bold hover-link">{tenant.name}</a>
	</div>

	<CartNavButton />
</header>
