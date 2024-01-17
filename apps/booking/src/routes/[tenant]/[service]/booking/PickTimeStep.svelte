<script lang="ts">
	import TimeSlotForm from '$lib/components/time/TimeSlotForm.svelte';
	import StepWrapper from './StepWrapper.svelte';
	import { getBookingStore } from '$lib/stores/booking';

	export let step: BookingStep<'time', TimeSlot>;

	const { summary, value, open, status } = step;

	let days: DaySlot[] = [];

	const {
		timeStores: { daySlots }
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
>
	<TimeSlotForm bind:selectedSlot={$value} {days} />
</StepWrapper>
