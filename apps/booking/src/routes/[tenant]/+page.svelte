<script lang="ts">
	import ServiceCard from '$lib/components/ServiceCard.svelte';
	import type { PageData } from './$types';
	import Hero from './Hero.svelte';

	export let data: PageData;
	const tenant = data.tenant;
	const services = data.services;
</script>

<svelte:head>
	<title>{tenant.name}</title>
</svelte:head>

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
<Hero {tenant} />
