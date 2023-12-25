<script lang="ts">
	import backend from '$lib/common/backend';
	import DayList from '$lib/components/time/DayList.svelte';

	export let value: TimeSlot | null;

	let days: DaySlot[] = [];

	backend.timeSlot.getAll('test', 'test').then((res) => {
		days = res;
	});
</script>

<DayList bind:selectedSlot={value} {days} />
