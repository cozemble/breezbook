<script lang="ts">
	import DayList from '$lib/components/time/DayList.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const tenant = data.tenant;
	const service = data.service;
</script>


<!-- Booking area -->
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
