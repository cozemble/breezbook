<script lang="ts">
	import Day from './Day.svelte';

	const days: DaySlot[] = [
		{
			date: Date.now(),
			timeSlots: [
				{
					from: '9:00',
					to: '11:00',
					price: 60,
					selected: false,
					onSelect: () => {
						const slot = days[0].timeSlots[0];
						slot.selected = !slot.selected;
						console.log(slot);
					}
				},
				{
					from: '12:00',
					to: '14:00',
					price: 62.5,
					selected: false,
					onSelect: () => {
						console.log('selected');
					}
				},
				{
					from: '15:00',
					to: '17:00',
					price: 62.5,
					selected: false,
					onSelect: () => {
						console.log('selected');
					}
				}
			]
		},
		{
			date: Date.now() + 86400000,
			timeSlots: [
				{
					from: '9:00',
					to: '11:00',
					price: 55,
					selected: false,
					onSelect: () => {
						console.log('selected');
					}
				},
				{
					from: '12:00',
					to: '14:00',
					price: 55,
					selected: false,
					onSelect: () => {
						console.log('selected');
					}
				},
				{
					from: '15:00',
					to: '17:00',
					price: 58,
					selected: false,
					onSelect: () => {
						console.log('selected');
					}
				}
			]
		},
		{
			date: Date.now() + 86400000 * 2,
			timeSlots: [
				{
					from: '9:00',
					to: '11:00',
					price: 55,
					selected: false,
					onSelect: () => {
						console.log('selected');
					}
				},
				{
					from: '12:00',
					to: '14:00',
					price: 55,
					selected: true,
					onSelect: () => {
						console.log('selected');
					}
				},
				{
					from: '15:00',
					to: '17:00',
					price: 58,
					selected: false,
					onSelect: () => {
						console.log('selected');
					}
				}
			]
		},
		{
			date: Date.now() + 86400000 * 3,
			timeSlots: [
				{
					from: '9:00',
					to: '11:00',
					price: 55,
					selected: false,
					onSelect: () => {
						console.log('selected');
					}
				},
				{
					from: '12:00',
					to: '14:00',
					price: 55,
					selected: false,
					onSelect: () => {
						console.log('selected');
					}
				},
				{
					from: '15:00',
					to: '17:00',
					price: 58,
					selected: false,
					onSelect: () => {
						console.log('selected');
					}
				}
			]
		},
		{
			date: Date.now() + 86400000 * 4,
			timeSlots: [
				{
					from: '9:00',
					to: '11:00',
					price: 55,
					selected: false,
					onSelect: () => {
						console.log('selected');
					}
				},
				{
					from: '12:00',
					to: '14:00',
					price: 55,
					selected: false,
					onSelect: () => {
						console.log('selected');
					}
				},
				{
					from: '15:00',
					to: '17:00',
					price: 58,
					selected: false,
					onSelect: () => {
						console.log('selected');
					}
				}
			]
		}
	];
</script>

<!-- TODO maybe weeks -->

<ul class="">
	{#each days as day, i (i)}
		<li>
			<Day {day} />
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
