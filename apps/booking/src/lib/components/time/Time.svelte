<script lang="ts">
	import { formatPrice } from '$lib/utils';

	export let slot: TimeSlot;
	export let selectedSlot: TimeSlot | null;

	$: isSelected = selectedSlot === slot;

	function onSelect() {
		selectedSlot = isSelected ? null : slot;
	}
</script>

<button
	class="btn w-full flex justify-between items-center
	{!isSelected ? 'btn-ghost' : 'btn-active'}"
	on:click={onSelect}
>
	<span>
		{slot.start}
		<span class="opacity-50 font-light px-2"> - </span>
		{slot.end}
	</span>

	<span class="text-primary">£{formatPrice(slot.price)}</span>
</button>
