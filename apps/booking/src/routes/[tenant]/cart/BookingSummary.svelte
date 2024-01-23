<script lang="ts">
	import Icon from '@iconify/svelte';
	import { formatPrice } from '$lib/utils';
	import { getCartStore } from '$lib/stores/cart';

	export let booking: Booking;

	const { service, calculatedPrice, time, extras, id } = booking;

	const { removeItem } = getCartStore();

	function remove() {
		console.log('remove item', id);
		removeItem(id);
	}
</script>

<!-- 
  @component
  To display the booking summary in the cart page.
  - service name and link
  - calculated price
  - date and time
  - extras 
  - remove button
  - TODO edit button (later on)
  - TODO duplicate button (later on)
 -->

<div class="flex items-center border-b gap-10 p-4">
	<!-- TODO figure the aspect ratio -->
	<div class="flex items-center gap-4">
		<img src={service.image} alt="service banner" class="aspect-square h-20 rounded-md" />

		<div class="flex flex-col gap-2">
			<a href="./{service.slug}" class="link-hover text-lg font-semibold" title="Go to service"
				>{service.name}</a
			>

			<div class="text-sm align-middle">
				<span
					>{new Date(time.day).toLocaleDateString('en-GB', {
						dateStyle: 'long'
					})}</span
				>
				-
				<span class="">
					<Icon icon="mdi:clock-time-four-outline" class="inline-block align-text-top mr-1" />
					{time.start} - {time.end}</span
				>
			</div>
		</div>
	</div>

	<div class="ml-auto flex flex-col gap-2 items-end">
		<span class="badge badg-sm"
			>{extras.length || 'no'} {extras.length === 1 ? 'extra' : 'extras'}
		</span>
		<!-- TODO dropdown menu to display extras (or something alike) -->
		<span class="font-bold">£ {formatPrice(calculatedPrice)}</span>
	</div>

	<div class="flex">
		<button class="btn btn-circle btn-ghost btn-md" title="Remove Item" on:click={remove}>
			<Icon icon="ph:trash-light" class="text-2xl" />
		</button>
	</div>
</div>
