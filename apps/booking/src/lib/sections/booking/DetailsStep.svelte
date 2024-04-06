<script lang="ts">
	import Loading from '$lib/components/Loading.svelte';
	import SchemaForm from '$lib/components/schemaForm/SchemaForm.svelte';
	import bookingStore from '$lib/stores/booking';
	import StepWrapper from './StepWrapper.svelte';

	const {
		details: { schema, errors, loading, value, submitWithCallback, step },
		finish
	} = bookingStore.get();

	const { open, status, available } = step;

	const handleSubmit = () => {
		submitWithCallback(() => {
			step.onComplete();
			finish();
		});
	};
</script>

<StepWrapper
	open={$open}
	label="Details"
	status={$status}
	onOpen={step.onOpen}
	disabled={!$available}
>
	<div class="max-w-md mx-auto">
		<!-- Schema is dynamically fetched so wait for it -->
		{#if $loading}
			<Loading />
		{:else}
			<SchemaForm
				schema={$schema}
				bind:value={$value}
				errors={$errors}
				remember={{
					enabled: true,
					key: 'booking-details'
				}}
				let:clearValues
			>
				<div class="flex justify-end gap-3 mt-2">
					<button class="btn btn-secondary" on:click={step.onGoBack}> Back </button>
					<button class="btn btn-warning" on:click={clearValues}>Clear</button>
					<button class="btn btn-primary" on:click={handleSubmit}> Finish Booking </button>
				</div>
			</SchemaForm>
		{/if}
	</div>
</StepWrapper>
