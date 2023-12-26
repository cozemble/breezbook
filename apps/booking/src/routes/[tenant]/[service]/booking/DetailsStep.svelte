<script lang="ts">
	const details: Service.Details = {
		name: '',
		email: '',
		phone: '',
		address: '',
		notes: ''
	};
	import StepWrapper from './StepWrapper.svelte';

	export let step: BookingFormStep;

	let value: Service.Details | null;

	// <!-- TODO validation -->
	const onSubmit = () => {
		if (!value) return;

		step.value = value;
		step.onComplete();
	};
</script>

<StepWrapper open={step.open} label="Details" status={step.status} onOpen={step.onOpen}>
	<label class="form-control w-full max-w-xs">
		<div class="label">
			<span class="label-text">Bank Name</span>
		</div>
		<input type="text" placeholder="Example Bank" class="input input-bordered w-full max-w-xs" />
	</label>

	<label class="form-control w-full max-w-xs">
		<div class="label">
			<span class="label-text">Bank Number</span>
			<div class="flex justify-end gap-3 mt-2">
				<button class="btn btn-secondary" on:click={step.onGoBack}> Back </button>
				<button class="btn btn-primary" on:click={onSubmit}> Finish Booking </button>
			</div>
			<input type="text" placeholder="12345678" class="input input-bordered w-full max-w-xs" />
		</div>
	</label>
</StepWrapper>
