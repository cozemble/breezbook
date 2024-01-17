<script lang="ts">
	import { initBookingStore } from '$lib/stores/booking';

	import DetailsStep from './DetailsStep.svelte';
	import ExtrasStep from './ExtrasStep.svelte';
	import PickTimeStep from './PickTimeStep.svelte';

	export let service: Service;

	const bookingStore = initBookingStore(service);

	//
</script>

<!-- 
	@component
	Booking steps as an accordion.
 -->

<PickTimeStep step={bookingStore.steps.timeStep} />
<ExtrasStep step={bookingStore.steps.extrasStep} />
<DetailsStep step={bookingStore.steps.detailsStep} />
