<script lang="ts">
	import { bookingStore } from '$lib/stores/booking';

	import DetailsStep from './DetailsStep.svelte';
	import ExtrasStep from './ExtrasStep.svelte';
	import PickTimeStep from './PickTimeStep.svelte';

	export let service: Service;

	bookingStore.init(service);

	//
</script>

<!-- 
	@component
	Booking steps as an accordion.
 -->

<PickTimeStep />
<ExtrasStep />
<DetailsStep />
