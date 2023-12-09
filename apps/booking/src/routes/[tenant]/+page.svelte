<script lang="ts">
	import ServiceCard from '$lib/components/ServiceCard.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const tenant = data.tenant;
	const services = data.services;
</script>

<svelte:head>
	<title>{data.tenant.name}</title>
</svelte:head>

<h1 class="text-4xl font-bold">{tenant.name}</h1>
<p>{tenant.description}</p>

<h2 class="text-2xl">Our Services</h2>
<div class="container">
	{#if !services?.length}
		<p>No services available</p>
	{:else}
		<ul class="flex flex-wrap gap-10 p-10">
			{#each services as service}
				<ServiceCard {service} {tenant} />
			{/each}
		</ul>
	{/if}
</div>
