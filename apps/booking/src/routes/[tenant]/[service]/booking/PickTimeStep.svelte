<script lang="ts">
	import TimeSlotForm from '$lib/components/time/TimeSlotForm.svelte';
	import StepWrapper from './StepWrapper.svelte';
	import { getBookingStore } from '$lib/stores/booking';
	import Loading from '$lib/components/Loading.svelte';

	export let step: BookingStep<'time', TimeSlot>;

	const { summary, value, open, status } = step;

	let days: DaySlot[] = [];

	const {
		timeStores: { daySlots, loading }
	} = getBookingStore();

	$: days = $daySlots;

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
	{#if days.length === 0}
		<p>No available time slots.</p>
	{:else}
		<TimeSlotForm bind:selectedSlot={$value} {days} />
	{/if}
</StepWrapper>
