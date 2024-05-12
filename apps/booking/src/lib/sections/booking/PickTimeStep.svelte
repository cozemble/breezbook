<script lang="ts">
	import TimeSlotForm from '$lib/components/time/TimeSlotForm.svelte';
	import StepWrapper from './StepWrapper.svelte';
	import bookingStore from '$lib/stores/booking';

	const {
		time: { daySlots, loading, value, step }
	} = bookingStore.get();

	const { open, status, available } = step;

	const onSubmit = () => {
		if (!$value) return;

		step.onComplete();
	};

	$: if ($value) onSubmit(); // auto submit when user selects a time slot
	$: summary = $value
		? `${new Date($value.day).toLocaleDateString('en-GB', {
				weekday: 'short',
				day: 'numeric',
				month: 'short'
		  })} ${$value.start} - ${$value.end}`
		: 'no time slot selected';
</script>

<!-- TODO date range filter -->

<StepWrapper
	id={step.id}
	open={$open}
	label="Pick a time"
	status={$status}
	onOpen={step.onOpen}
	{summary}
	loading={$loading}
	disabled={!$available}
>
	{#if $daySlots.length === 0}
		<p>No available time slots.</p>
	{:else}
		<TimeSlotForm bind:selectedSlot={$value} days={$daySlots} />
	{/if}
</StepWrapper>
