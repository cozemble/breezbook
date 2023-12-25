<script lang="ts">
	import Day from './Day.svelte';

	export let days: DaySlot[];
	export let selectedSlot: TimeSlot | null;
</script>

<!-- TODO maybe weeks -->

<ul class="">
	{#each days as day, i (i)}
		<li>
			<Day {day} bind:selectedSlot />
		</li>
	{/each}
</ul>

<style>
	ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
		gap: 1rem;
	}
</style>
