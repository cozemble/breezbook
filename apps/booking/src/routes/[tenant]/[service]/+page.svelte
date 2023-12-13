<script lang="ts">
	import DayList from '$lib/components/time/DayList.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const service = data.service;
</script>

<!-- Service description -->
<section class="flex justify-between items-center mb-20">
	<div>
		<h1 class="text-3xl text-primary font-semibold">{service.name}</h1>
		<p class="text-lg">{service.description}</p>

		<!-- TODO format properly -->
		<div class="text-3xl font-bold mt-4">
			<span class="opacity-30 text-2xl"> ≈ </span>

			£{service.approximatePrice}
			<span class="text-base font-thin opacity-60 whitespace-nowrap"
				>/ {service.approximateDuration} mins</span
			>
		</div>
	</div>

	<img
		src={service.image}
		alt="service banner"
		class="rounded-lg shadow-2xl aspect-[5/2] object-cover"
	/>
</section>

<section>
	<div class="border-base-300">
		<h1 class="text-xl text-secondary font-semibold pb-2 mb-6 border-b">Pick a time</h1>
		<!-- Service time slots -->

		<DayList />
	</div>
	<div class="flex justify-end">
		<button class="btn btn-primary"> Next </button>
	</div>
</section>
