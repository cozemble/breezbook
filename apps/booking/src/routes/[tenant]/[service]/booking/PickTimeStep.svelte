<script lang="ts">
	import backend from '$lib/common/backend';
	import TimeSlotForm from '$lib/components/time/TimeSlotForm.svelte';

	export let value: TimeSlot | null;
	export let onComplete: () => void;

	let days: DaySlot[] = [];

	backend.timeSlot.getAll('test', 'test').then((res) => {
		days = res;
	});
</script>

<!-- TODO date range filter -->

<TimeSlotForm bind:selectedSlot={value} {days} />

<div class="flex justify-end gap-3 mt-2">
	<button class="btn btn-primary" on:click={onComplete} disabled={!value}> Next </button>
</div>
