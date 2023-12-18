<script lang="ts">
	import ServiceCard from '$lib/components/ServiceCard.svelte';

	export let services: Service[] | null;
	export let tenant: Tenant;
</script>

<div class="max-w-7xl w-full flex flex-col">
	<h2 class="pb-4 mb-10 text-3xl font-semibold text-secondary border-b-2">Our Services</h2>
	<section id="services" class="pt-16 flex flex-col items-center">
		{#if !services?.length}
			<p>No services available</p>
		{:else}
			<ul>
				{#each services as service}
					<ServiceCard {service} {tenant} />
				{/each}
			</ul>
		{/if}
	</section>
</div>

<!-- as much as i like tailwind, it sucks for grid layouts -->
<style>
	ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
	}
</style>
