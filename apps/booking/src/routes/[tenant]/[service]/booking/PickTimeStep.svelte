<script lang="ts">
	import api from '$lib/common/api';
	import TimeSlotForm from '$lib/components/time/TimeSlotForm.svelte';
	import { onMount } from 'svelte';
	import StepWrapper from './StepWrapper.svelte';

	export let step: BookingStep<'time', TimeSlot>;

	const { summary, value, open, status } = step;

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
		if (!$value) return;

		step.onComplete();
	};

	$: if ($value) onSubmit();
</script>

<!-- TODO date range filter -->

<StepWrapper
	open={$open}
	label="Pick a time"
	status={$status}
	onOpen={step.onOpen}
	summary={$summary}
>
	<TimeSlotForm bind:selectedSlot={$value} {days} />
</StepWrapper>
