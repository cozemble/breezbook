<script lang="ts">
	import DayList from '$lib/components/time/DayList.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const tenant = data.tenant;
	const service = data.service;
</script>

<div class="text-sm breadcrumbs">
	<ul>
		<li><a href="/{tenant.slug}">Services</a></li>
		<li><a href="/{tenant.slug}/{service.slug}">{service.name}</a></li>
		<li>Booking</li>
	</ul>
</div>

<!-- Booking area -->
<section class="">
	<section class="flex flex-col justify-center items-center mb-10">
		<!-- Steps -->
		<div class=" flex-grow flex flex-col items-center">
			<ul class="steps w-96">
				<li class="step step-primary font-semibold text-primary text-lg">Pick a Time</li>
				<li class="step">Extras</li>
				<li class="step">Details</li>
			</ul>
		</div>

	</section>

	<section>
		<div class="border-base-300">
			<!-- <h1 class="text-xl text-secondary font-semibold pb-2 mb-6 border-b">Pick a time</h1> -->
			<!-- Service time slots -->

			<DayList />
		</div>
		<div class="flex justify-end">
			<button class="btn btn-primary"> Next </button>
		</div>
	</section>
</section>
