<script lang="ts">
	import Slot from './Time.svelte';

	export let day: DaySlot;

	const formattedDate = new Date(day.date).toLocaleDateString('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'short'
	});
</script>

<div class="card">
	<div class="card-body p-4">
		<h2 class="card-title text-lg text-secondary justify-center font-normal border-b pb-2">
			{formattedDate}
		</h2>

		<!-- times in days -->
		<ul>
			{#each day.timeSlots as time}
				<li class="">
					<Slot {time} />
				</li>
			{/each}
		</ul>
	</div>
</div>
