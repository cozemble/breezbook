<script lang="ts">
	import api from '$lib/common/api';
	import TimeSlotForm from '$lib/components/time/TimeSlotForm.svelte';
	import StepWrapper from './StepWrapper.svelte';

	export let step: BookingFormStep;

	let value: TimeSlot | null;

	let days: DaySlot[] = [];

	api.timeSlot.getAll('test', 'test').then((res) => {
		days = res;
	});

	// <!-- TODO properly format the value -->

	const onSubmit = () => {
		if (!value) return;

		step.value = value;
		step.onComplete();
	};

	$: summary = value
		? `${value.day.toLocaleDateString('en-GB', {
				weekday: 'short',
				day: 'numeric',
				month: 'short'
		  })} ${value.start} - ${value.end}`
		: 'no time selected';
</script>

<!-- TODO date range filter -->

<StepWrapper
	open={step.open}
	label="Pick a time"
	status={step.status}
	onOpen={step.onOpen}
	{summary}
>
	<TimeSlotForm bind:selectedSlot={value} {days} />

	<div class="flex justify-end gap-3 mt-2">
		<button class="btn btn-primary" on:click={onSubmit} disabled={!value}> Next </button>
	</div>
</StepWrapper>
