<script lang="ts">
	export let time: TimeSlot;

	const selected = time.selected;

	const onSelect = time.onSelect;
</script>

<button
	class="btn w-full flex justify-between items-center
	{!selected ? 'btn-ghost' : 'btn-active'}"
	on:click={onSelect}
>
	<span>
		{time.from}
		<span class="opacity-50 font-light px-2"> - </span>
		{time.to}
	</span>

	<span class="text-primary">£{time.price}</span>
</button>
