<script lang="ts">
	import api from '$lib/common/api';
	import TimeSlotForm from '$lib/components/time/TimeSlotForm.svelte';
	import { onMount } from 'svelte';
	import StepWrapper from './StepWrapper.svelte';

	export let step: BookingFormStep;

	let value: TimeSlot | null;

	let days: DaySlot[] = [];

	onMount(async () => {
		await api.timeSlot
			.getAll('test', 'test', {
				fromDate: new Date(),
				toDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
			})
			.then((res) => {
				days = res;
			});
	});

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
		: 'no time slot selected';
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
