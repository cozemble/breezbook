<script lang="ts">
	import Day from './Day.svelte';

	export let selectedSlot: TimeSlot | null;

	export let days: DaySlot[];

	// export let days: DaySlot[] = [
	// 	{
	// 		date: Date.now(),
	// 		timeSlots: [
	// 			{
	// 				from: '9:00',
	// 				to: '11:00',
	// 				price: 60,
	// 				day: Date.now()
	// 			},
	// 			{
	// 				from: '12:00',
	// 				to: '14:00',
	// 				price: 62.5,
	// 				day: Date.now()
	// 			},
	// 			{
	// 				from: '15:00',
	// 				to: '17:00',
	// 				price: 62.5,
	// 				day: Date.now()
	// 			}
	// 		]
	// 	},
	// 	{
	// 		date: Date.now() + 86400000,
	// 		timeSlots: [
	// 			{
	// 				from: '9:00',
	// 				to: '11:00',
	// 				price: 55,
	// 				day: Date.now() + 86400000
	// 			},
	// 			{
	// 				from: '12:00',
	// 				to: '14:00',
	// 				price: 55,
	// 				day: Date.now() + 86400000
	// 			},
	// 			{
	// 				from: '15:00',
	// 				to: '17:00',
	// 				price: 58,
	// 				day: Date.now() + 86400000
	// 			}
	// 		]
	// 	},
	// 	{
	// 		date: Date.now() + 86400000 * 2,
	// 		timeSlots: [
	// 			{
	// 				from: '9:00',
	// 				to: '11:00',
	// 				price: 55,
	// 				day: Date.now() + 86400000 * 2
	// 			},
	// 			{
	// 				from: '12:00',
	// 				to: '14:00',
	// 				price: 55,
	// 				day: Date.now() + 86400000 * 2
	// 			},
	// 			{
	// 				from: '15:00',
	// 				to: '17:00',
	// 				price: 58,
	// 				day: Date.now() + 86400000 * 2
	// 			}
	// 		]
	// 	},
	// 	{
	// 		date: Date.now() + 86400000 * 3,
	// 		timeSlots: [
	// 			{
	// 				from: '9:00',
	// 				to: '11:00',
	// 				price: 55,
	// 				day: Date.now() + 86400000 * 3
	// 			},
	// 			{
	// 				from: '12:00',
	// 				to: '14:00',
	// 				price: 55,
	// 				day: Date.now() + 86400000 * 3
	// 			},
	// 			{
	// 				from: '15:00',
	// 				to: '17:00',
	// 				price: 58,
	// 				day: Date.now() + 86400000 * 3
	// 			}
	// 		]
	// 	},
	// 	{
	// 		date: Date.now() + 86400000 * 4,
	// 		timeSlots: [
	// 			{
	// 				from: '9:00',
	// 				to: '11:00',
	// 				price: 55,
	// 				day: Date.now() + 86400000 * 4
	// 			},
	// 			{
	// 				from: '12:00',
	// 				to: '14:00',
	// 				price: 55,
	// 				day: Date.now() + 86400000 * 4
	// 			},
	// 			{
	// 				from: '15:00',
	// 				to: '17:00',
	// 				price: 58,
	// 				day: Date.now() + 86400000 * 4
	// 			}
	// 		]
	// 	}
	// ];
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
