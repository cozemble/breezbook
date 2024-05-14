<script lang="ts">
	import type { PageData } from './$types';

	import tenantStore from '$lib/stores/tenant';
	import { settingsStore } from '$lib/stores/settings';
	import { locationStore } from '$lib/stores/location';
	import routeStore from '$lib/stores/routes';
	import checkoutStore from '$lib/stores/checkout';
	import orderHistoryStore from '$lib/stores/orderHistory';

	import NotificationProvider from '$lib/components/notifications/NotificationProvider.svelte';

	import Footer from '$lib/sections/home/Footer.svelte';
	import Header from '$lib/sections/home/Header.svelte';

	export let data: PageData;
	const tenant = data.tenant;
	const tenantLocation = data.location;

	tenantStore.init(tenant);
	locationStore.init(tenantLocation);
	routeStore.init();
	settingsStore.init();
	checkoutStore.init();
	orderHistoryStore.init();
</script>

<div
	class="min-h-screen flex flex-col items-center"
	data-theme={tenant.theme?.theme}
	style={tenant.theme?.font?.sans && `font-family: ${tenant.theme?.font?.sans};`}
>
	<Header />
	<main class="p-3 md:p-6 flex-grow w-full flex flex-col items-center">
		<div class="max-w-7xl w-full flex-grow flex">
			<slot />
		</div>
	</main>
	<Footer />

	<NotificationProvider />
</div>
