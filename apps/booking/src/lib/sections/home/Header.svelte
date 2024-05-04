<script lang="ts">
	import tenantStore from '$lib/stores/tenant';
	import CartNavButton from './CartNavButton.svelte';
	import LocationWithMenu from './LocationWithMenu.svelte';
	import routeStore from '$lib/stores/routes';

	const routes = routeStore.get();
	const tenant = tenantStore.get();
</script>

<header
	class="navbar px-3 md:px-6 py-4 flex justify-center
	sticky top-0 left-0 right-0 z-50
	border-b
	"
>
	<div class="w-full max-w-7xl flex justify-between">
		<div class="flex-1 flex flex-col">
			<a href={routes.home()} class="text-xl font-bold hover-link">{tenant.name}</a>

			<LocationWithMenu />
		</div>

		<CartNavButton />
	</div>
</header>
