<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { JourneyState } from '$lib/uxs/personal-training/journeyState';
	import { type PricedBasket, unpricedBasket, unpricedBasketLine } from '@breezbook/backend-api-types';
	import { mandatory } from '@breezbook/packages-core';
	import { backendUrl, fetchJson } from '$lib/helpers';
	import StripePaymentForm from '$lib/uxs/personal-training/StripePaymentForm.svelte';
	import { duration, minutes, time24 } from '@breezbook/packages-date-time';
	import { translations } from '$lib/ui/stores';
	import { env, tenantId } from '$lib/uxs/personal-training/constants';
	import { ChevronLeft } from 'lucide-svelte';

	export let state: JourneyState;
	let priced: PricedBasket;
	let showStripe = false;
	const dispatch = createEventDispatcher();
	let stripeFormLoaded = false;

	onMount(async () => {
		const date = mandatory(state.selectedSlot?.day, 'selectedSlot.day');
		const time = mandatory(state.selectedSlot?.slot.startTime24hr, 'selectedSlot.slot.startTime24hr');
		const service = mandatory(state.tenant.services.find(s => s.id === state.serviceId), 'service');
		const basket = unpricedBasket([unpricedBasketLine(state.serviceId, state.locationId, [], date, time24(time), duration(minutes(service.durationMinutes)), state.filledForms ?? [], state.requirementOverrides ?? [])]);
		console.log({ basket });
		priced = await fetchJson(backendUrl(`/api/dev/breezbook-gym/basket/price`), {
			method: 'POST',
			body: JSON.stringify(basket)
		});
		console.log({ priced });
	});

	function onPay() {
		showStripe = true;
	}

	function onBack() {
		dispatch('back');
	}

	function onPaymentFormLoaded() {
		stripeFormLoaded = true;
	}
</script>

{#if showStripe && priced && state.customerDetails}
	{#if stripeFormLoaded}
		<div class="text-center text-sm text-base-content/70">
			<p>{$translations.use4242}</p>
			<p>{$translations.useFutureExpiry}</p>
			<p>{$translations.useAnyCVC}</p>
		</div>
	{:else}
		<div class="text-center">
			<div class="loading loading-spinner loading-lg text-primary"></div>
			<p class="mt-4 text-lg font-semibold">{$translations.loadingCheckoutForm}</p>
		</div>
	{/if}
	<div>
		<StripePaymentForm {priced}
											 customerDetails={state.customerDetails}
											 {tenantId}
											 environmentId={env}
											 on:paymentFormLoaded={onPaymentFormLoaded}
											 on:paymentComplete />
	</div>
{:else if priced}
	<div>

		<div class="mt-6 flex">
			<button on:click={onBack} class="btn mr-6">
				<ChevronLeft size={28} />
			</button>

			<div class="flex justify-end w-full">
				<button class="btn btn-primary w-5/6" on:click={onPay}>{$translations.pay}</button>
			</div>
		</div>

	</div>
{/if}