<script lang="ts">
	import DetailsStep from './DetailsStep.svelte';
	import ExtrasStep from './ExtrasStep.svelte';
	import PickTimeStep from './PickTimeStep.svelte';

	let timeStep: BookingFormStep = {
		name: 'time',
		status: 'default',
		open: true,
		value: null,
		onComplete: () => {
			if (!timeStep.value) return;

			timeStep.status = 'success';
			extrasStep.onOpen();
		},
		onOpen: () => {
			timeStep.open = true;
			extrasStep.open = false;
			detailsStep.open = false;
		}
	};

	let extrasStep: BookingFormStep = {
		name: 'extras',
		status: 'default',
		open: false,
		value: null,
		onComplete: () => {
			if (!extrasStep.value) return;

			extrasStep.status = 'success';
			detailsStep.onOpen();
		},
		onOpen: () => {
			if (timeStep.status !== 'success') return;

			extrasStep.open = true;
			timeStep.open = false;
			detailsStep.open = false;
		},
		onGoBack: () => {
			timeStep.onOpen();
		}
	};

	let detailsStep: BookingFormStep = {
		name: 'details',
		status: 'default',
		open: false,
		value: null,
		onComplete: () => {
			if (!detailsStep.value) return;

			detailsStep.open = false;
			detailsStep.status = 'success';
		},
		onOpen: () => {
			if (extrasStep.status !== 'success') return;

			detailsStep.open = true;
			timeStep.open = false;
			extrasStep.open = false;
		},
		onGoBack: () => {
			extrasStep.onOpen();
		}
	};

	//
</script>

<!-- 
	@component
	Booking steps as an accordion.
 -->

<PickTimeStep bind:step={timeStep} />
<ExtrasStep bind:step={extrasStep} />
<DetailsStep bind:step={detailsStep} />
