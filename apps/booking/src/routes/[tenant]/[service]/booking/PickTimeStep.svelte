<script lang="ts">
	import DayList from '$lib/components/time/DayList.svelte';

	export let onComplete: () => void;

	export let value: TimeSlot | null;
</script>

<DayList />

<button
	on:click={() => {
		value = {
			from: '9:00',
			to: '11:00',
			price: 60,
			selected: false,
			onSelect: () => {}
		};
	}}
	class="btn">Select</button
>
