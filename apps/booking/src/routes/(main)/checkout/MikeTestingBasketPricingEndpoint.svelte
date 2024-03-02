<script lang="ts">
	import { onMount } from 'svelte';
	import tenantStore from '$lib/stores/tenant';
	import checkoutStore from '$lib/stores/checkout';
	import { unpricedBasket, unpricedBasketLine } from '@breezbook/backend-api-types';
	import * as core from '@breezbook/packages-core';
	import { addOnId, addOnOrder } from '@breezbook/packages-core';

	const tenant = tenantStore.get();
	const { items } = checkoutStore.get();

	function toUnpricedBasketItem(booking: Booking) {
		console.log({booking})
		const addOns = booking.extras.map(extra => addOnOrder(addOnId(extra.id)));
		return unpricedBasketLine(core.carwash.smallCarWash.id, addOns, core.isoDate(booking.time.day), core.timeslotSpec(
			core.time24(booking.time.start),
			core.time24(booking.time.end),
			'',
			core.id(booking.time.id)
		));
	}

	async function callBasketPricingEndpoint() {
		const basket = unpricedBasket($items.map(toUnpricedBasketItem));
		const tenantSlug = 'tenant1'
		console.log({tenant})
		const response = await fetch(`https://breezbook-backend-airtable-qwquwvrytq-nw.a.run.app/api/dev/${tenantSlug}/basket/price`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(basket)
		});
		const data = await response.json();
		console.log(data);
	}

	onMount(() => {
		async function handleKeydown(event: KeyboardEvent) {
			if (event.ctrlKey && event.key === 'g') {
				console.log('CTRL-g was pressed');
				await callBasketPricingEndpoint();
			}
		}

		window.addEventListener('keydown', handleKeydown);

		// Don't forget to remove the event listener to prevent memory leaks
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

