<script lang="ts">
	import api from '$lib/common/api';

	let tenants: Tenant[] = [];

	api.tenant.getAll().then((res) => {
		tenants = res;
	});
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
				<a href="/{tenant.slug}" class="link text-secondary">{tenant.name}</a>
			</li>
		{/each}
	</ul>
</div>
