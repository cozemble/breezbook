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

<div class="flex items-center gap-10 py-4">
	<!-- TODO figure the aspect ratio -->
	<div class="flex items-start gap-4">
		<img src={service.image} alt="service banner" class="aspect-square h-20 rounded-md" />

		<div class="flex flex-col">
			<a href="./{service.slug}" class="link-hover text-lg font-semibold" title="Go to service"
				>{service.name}</a
			>

			<div class="text-sm align-middle mb-2">
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

			<div class="dropdown">
				<span tabindex="0" role="button" class="badge"
					>{extras.length || 'no'} {extras.length === 1 ? 'extra' : 'extras'}
				</span>
				{#if extras.length > 0}
					<!-- svelte-ignore a11y-no-noninteractive-tabindex-->
					<ul
						tabindex="0"
						class="dropdown-content z-[1] p-2 shadow bg-base-100 rounded-box w-52 border"
					>
						{#each extras as extra}
							<li class="flex items-center justify-between gap-2">
								<span class="text-xs">{extra.name}</span>
								<span class="text-xs font-semibold">£ {formatPrice(extra.price)}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</div>

	<div class="ml-auto flex flex-col items-end justify-between self-stretch max-h-none">
		<div class="flex">
			<button class="btn btn-circle btn-ghost btn-xs" title="Remove Item" on:click={remove}>
				<!-- <Icon icon="ph:trash" class="text-xl" /> -->
				<Icon icon="mdi:close" class="text-lg" />
			</button>
		</div>

		<div class=" ml-auto flex flex-col gap-2 items-end">
			<span class="text-lg font-bold">£ {formatPrice(calculatedPrice)}</span>
		</div>
	</div>
</div>
