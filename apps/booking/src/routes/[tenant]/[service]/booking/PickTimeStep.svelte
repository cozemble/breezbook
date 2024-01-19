<script lang="ts">
	import TimeSlotForm from '$lib/components/time/TimeSlotForm.svelte';
	import StepWrapper from './StepWrapper.svelte';
	import { getBookingStore } from '$lib/stores/booking';

	const {
		time: { daySlots, loading, value, step }
	} = getBookingStore();

	const { summary, open, status, available } = step;

	const onSubmit = () => {
		if (!$value) return;

		step.onComplete();
	};

	$: if ($value) onSubmit(); // auto submit when user selects a time slot
</script>

<!-- TODO date range filter -->

<StepWrapper
	open={$open}
	label="Pick a time"
	status={$status}
	onOpen={step.onOpen}
	summary={$summary}
	loading={$loading}
	disabled={!$available}
>
	{#if $daySlots.length === 0}
		<p>No available time slots.</p>
	{:else}
		<TimeSlotForm bind:selectedSlot={$value} days={$daySlots} />
	{/if}
</StepWrapper>
