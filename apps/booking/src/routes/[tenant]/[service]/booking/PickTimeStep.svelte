<script lang="ts">
	import TimeSlotForm from '$lib/components/time/TimeSlotForm.svelte';
	import StepWrapper from './StepWrapper.svelte';
	import { getBookingStore } from '$lib/stores/booking';

	const {
		timeStores: { daySlots, loading },
		steps: { timeStep: step }
	} = getBookingStore();

	const { summary, value, open, status } = step;

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
	loading={$loading}
>
	{#if $daySlots.length === 0}
		<p>No available time slots.</p>
	{:else}
		<TimeSlotForm bind:selectedSlot={$value} days={$daySlots} />
	{/if}
</StepWrapper>
