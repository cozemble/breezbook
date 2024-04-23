<script lang="ts">
	import type { PageData } from './$types';

	import tenantStore from '$lib/stores/tenant';
	import checkoutStore from '$lib/stores/checkout';

	import NotificationProvider from '$lib/components/notifications/NotificationProvider.svelte';

	import Footer from '$lib/sections/home/Footer.svelte';
	import Header from '$lib/sections/home/Header.svelte';
	import orderHistoryStore from '$lib/stores/orderHistory';

	export let data: PageData;
	const tenant = data.tenant;

	tenantStore.init(tenant);
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
		<div class="max-w-7xl w-full">
			<slot />
		</div>
	</main>
	<Footer />

	<NotificationProvider />
</div>
