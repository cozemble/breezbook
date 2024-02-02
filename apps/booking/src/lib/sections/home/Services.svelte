<script lang="ts">
	import ServiceCard from '$lib/components/ServiceCard.svelte';
	import tenantStore from '$lib/stores/tenant';

	export let services: Service[] | null;

	const tenant = tenantStore.get();
</script>

<section id="services" class="pt-16 flex flex-col items-center">
	<div class="w-full flex flex-col">
		<h2 class="pb-4 mb-10 text-2xl font-bold text-primary border-b-2">Our Services</h2>

		{#if !services?.length}
			<p>No services available</p>
		{:else}
			<ul>
				{#each services as service}
					<ServiceCard {service} {tenant} />
				{/each}
			</ul>
		{/if}
	</div>
</section>

<!-- as much as i like tailwind, it sucks for grid layouts -->
<style>
	ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
	}
</style>
