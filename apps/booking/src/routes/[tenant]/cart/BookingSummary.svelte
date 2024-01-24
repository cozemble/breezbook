<script lang="ts">
	import Icon from '@iconify/svelte';
	import { formatPrice } from '$lib/utils';
	import { getCartStore } from '$lib/stores/cart';

	export let booking: Booking;

	const { service, calculatedPrice, time, extras, id } = booking;

	const { removeItem } = getCartStore();

	function remove() {
		// <!-- TODO ask for confirmation -->

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

<div class="flex flex-col bg-base-100 rounded-box">
	<div class="flex flex-between px-4 py-1 border-b">
		<div class="flex ml-auto">
			<button class="btn btn-circle btn-ghost btn-xs" title="Remove Item" on:click={remove}>
				<!-- <Icon icon="ph:trash" class="text-xl" /> -->
				<Icon icon="mdi:close" class="text-lg" />
			</button>
		</div>
	</div>

	<div class="flex items-start flex-col md:flex-row gap-4 p-4">
		<!-- TODO figure the aspect ratio -->
		<div class="flex items-start gap-4 w-full">
			<img src={service.image} alt="service banner" class="aspect-square h-10 md:h-20 rounded-md" />

			<div class="flex flex-col">
				<a
					href="./{service.slug}"
					class="link-hover text-lg md:text-xl font-semibold"
					title="Go to service">{service.name}</a
				>

				<div class="text-xs md:text-sm mt-2 flex flex-col">
					<span>
						<Icon icon="mdi:calendar-month-outline" class="inline-block align-text-top mr-1" />
						{new Date(time.day).toLocaleDateString('en-GB', {
							dateStyle: 'long'
						})}
					</span>

					<span class="whitespace-nowrap">
						<Icon icon="mdi:clock-time-four-outline" class="inline-block align-text-top mr-1" />
						{time.start} - {time.end}</span
					>
				</div>
			</div>
		</div>

		<table class="table table-xs">
			<tbody>
				<tr>
					<td class="font-semibold text-sm"> Service </td>
					<td class="text-right font-bold text-sm">£ {formatPrice(calculatedPrice)}</td>
				</tr>

				{#each extras as extra}
					<tr>
						<td class="font-semibold text-xs">
							<Icon icon="mdi:plus" class="text-sm inline-block" />
							{extra.name}</td
						>
						<td class="text-right font-bold text-xs">£ {formatPrice(extra.price)}</td>
					</tr>
				{/each}
			</tbody>

			<tfoot>
				<tr class="border-t text-base-content">
					<td class="text-base"> Service Total </td>
					<td class="text-right text-base">
						£ {formatPrice(calculatedPrice + extras.reduce((acc, extra) => acc + extra.price, 0))}
						<!-- TODO just for display, fix later -->
					</td>
				</tr>
			</tfoot>
		</table>

		<!-- <div class="ml-auto flex flex-col items-end justify-between self-stretch max-h-none">
			<div class="mt-4 flex flex-col items-end justify-end">
				<div>
					<span class="text-lg font-bold">£ {formatPrice(calculatedPrice)}</span>
				</div>
			</div>
		</div> -->
	</div>
</div>
