<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	const tenant = data.tenant;
	const service = data.service;
</script>

<svelte:head>
	<title>{tenant.name} - {service.name}</title>
</svelte:head>

<!-- Service hero -->
<section class="flex justify-between items-center my-10 rounded-lg">
	<div>
		<h1 class="text-2xl text-primary font-semibold">{service.name}</h1>
		<p class="text-lg">{service.description}</p>

		<!-- TODO format properly -->
		<div class="text-2xl font-bold mt-4">
			<span class="opacity-30 text-2xl"> ≈ </span>

			£{service.approximatePrice}
			<span class="text-base font-thin opacity-60 whitespace-nowrap"
				>/ {service.approximateDuration} mins</span
			>
		</div>
		<a href="./{service.slug}/booking" class="btn btn-primary mt-8">Book Now</a>
	</div>

	<img
		src={service.image}
		alt="service banner"
		class="rounded-lg shadow-2xl aspect-[5/2] h-60 object-cover"
	/>
</section>

<!-- TODO details of the service -->
