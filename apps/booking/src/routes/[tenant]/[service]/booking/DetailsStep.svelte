<script lang="ts">
	import SchemaForm from '$lib/components/schemaForm/SchemaForm.svelte';
	import { getBookingStore } from '$lib/stores/booking';
	import { onMount } from 'svelte';
	import StepWrapper from './StepWrapper.svelte';

	const {
		steps: { detailsStep: step },
		detailsStore: { schema, errors, value, onSubmit: submitDetails }
	} = getBookingStore();

	const { open, status } = step;

	const onSubmit = () => {
		submitDetails();
		step.onComplete();
	};

	$: console.log('value:', $value);
	$: console.log('errors:', $errors);
</script>

<StepWrapper open={$open} label="Details" status={$status} onOpen={step.onOpen}>
	<div class="max-w-md mx-auto">
		<SchemaForm schema={$schema} bind:value={$value} errors={$errors} />
	</div>

	<div class="flex justify-end gap-3 mt-2">
		<button class="btn btn-secondary" on:click={step.onGoBack}> Back </button>
		<button class="btn btn-primary" on:click={onSubmit}> Finish Booking </button>
	</div>
</StepWrapper>
