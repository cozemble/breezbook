<script lang="ts">
	import Time from './Time.svelte';

	export let day: DaySlot;
	export let selectedSlot: TimeSlot | null;

	const formattedDate = new Date(day.date).toLocaleDateString('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'short'
	});
</script>

<div class="card">
	<div class="card-body p-4">
		<h2
			class="card-title text-lg text-secondary justify-center font-normal border-b border-base-300 pb-2"
		>
			{formattedDate}
		</h2>

		<!-- times in days -->
		<ul>
			{#each day.timeSlots as time}
				<li class="">
					<Time slot={time} bind:selectedSlot />
				</li>
			{/each}
		</ul>
	</div>
</div>
