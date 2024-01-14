<script lang="ts">
	import SchemaForm from '$lib/components/schemaForm/SchemaForm.svelte';
	import StepWrapper from './StepWrapper.svelte';

	export let step: BookingStep<'details', Service.Details>;

	const { value, open, status } = step;

	// <!-- TODO get schema from service -->
	const mockJsonSchema = `
		{
			"type": "object",
			"$schema": "http://json-schema.org/draft-07/schema#",
			"required": [
				"make",
				"model",
				"colour",
				"year"
			],
			"properties": {
				"make": {
					"type": "string",
					"description": "The manufacturer of the car."
				},
				"year": {
					"type": "integer",
					"description": "The manufacturing year of the car."
				},
				"model": {
					"type": "string",
					"description": "The model of the car."
				},
				"colour": {
					"type": "string",
					"description": "The color of the car."
				}
			},
			"additionalProperties": false
		}`;

	const schema = JSON.parse(mockJsonSchema);

	// <!-- TODO validation -->
	const onSubmit = () => {
		if (!value) return;

		step.value = value;
		step.onComplete();
	};
</script>

<StepWrapper open={$open} label="Details" status={$status} onOpen={step.onOpen}>
	<div class="max-w-md mx-auto">
		<SchemaForm {schema} bind:value={$value} errors={{}} />
	</div>

	<div class="flex justify-end gap-3 mt-2">
		<button class="btn btn-secondary" on:click={step.onGoBack}> Back </button>
		<button class="btn btn-primary" on:click={onSubmit}> Finish Booking </button>
	</div>
</StepWrapper>
