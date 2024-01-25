<script lang="ts">
	import { page } from '$app/stores';
	import api from '$lib/common/api';

	let tenants: Tenant[] = [];

	api.tenant.getAll().then((res) => {
		tenants = res;
	});

	/** Create the link for the tenant subdomain based on the current page URL
	 * - handles the ssl and port
	 * - returns the full URL
	 */
	const tenantLink = (tenantSlug: string) => {
		const [http, domain] = $page.url.origin.split('//');

		const domainWithoutWww = domain.replace('www.', '');

		return `${http}//${tenantSlug}.${domainWithoutWww}`;
	};
</script>

<svelte:head>
	<title>breezbook</title>
</svelte:head>

<div class="p-10">
	<h1 class="text-4xl mb-10 font-black text-accent">
		<span class="text-primary">breez</span>book
	</h1>

	<h2 class="text-xl mb-8">Tenants</h2>

	<ul class="menu border-l">
		{#each tenants as tenant}
			<li>
				<a href={tenantLink(tenant.slug)} class="link text-secondary">{tenant.name}</a>
			</li>
		{/each}
	</ul>
</div>
