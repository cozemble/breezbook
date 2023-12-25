<script lang="ts">
	import backend from '$lib/common/backend';
	import TimeSlotForm from '$lib/components/time/TimeSlotForm.svelte';

	export let value: TimeSlot | null;

	let days: DaySlot[] = [];

	backend.timeSlot.getAll('test', 'test').then((res) => {
		days = res;
	});
</script>

<TimeSlotForm bind:selectedSlot={value} {days} />
