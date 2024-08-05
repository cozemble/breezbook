<script lang="ts">
	import {
		type AnySuitableResourceSpec,
		api,
		type AvailabilityResponse,
		type ResourceSummary,
		type Service,
		type Tenant
	} from '@breezbook/backend-api-types';
	import { onMount } from 'svelte';
	import { backendUrl, fetchJson } from '$lib/helpers';
	import { isoDateFns, timezones } from '@breezbook/packages-date-time';
	import SelectSlot from '$lib/uxs/personal-training/SelectSlot.svelte';
	import {
		type CoreCustomerDetails,
		initializeJourneyState,
		type JourneyState,
		type Slot
	} from '$lib/uxs/personal-training/journeyState';
	import { journeyStateFns } from '$lib/uxs/personal-training/journeyState.js';
	import FillForm from '$lib/uxs/personal-training/FillForm.svelte';
	import FillCustomerDetails from '$lib/uxs/personal-training/FillCustomerDetails.svelte';
	import TakePayment from '$lib/uxs/personal-training/TakePayment.svelte';
	import { language, translations } from '$lib/ui/stores';

	export let tenant: Tenant;
	export let trainer: ResourceSummary;
	export let locationId: string;
	export let service: Service;
	export let personalTrainerRequirement: AnySuitableResourceSpec;
	let availableSlots: AvailabilityResponse;
	let showNoAvailabilityMessage = false;
	const today = isoDateFns.today(timezones.utc);
	const sevenDaysFromNow = isoDateFns.addDays(today, 7);
	const dayList = isoDateFns.listDays(today, sevenDaysFromNow);
	let journeyState: JourneyState;

	onMount(async () => {
		const dateRange = `fromDate=${today.value}&toDate=${sevenDaysFromNow.value}`;
		const requirementOverrides = [{
			requirementId: personalTrainerRequirement.id.value,
			resourceId: trainer.id
		}];
		const options = api.serviceAvailabilityOptions([], requirementOverrides, []);

		try {
			availableSlots = await fetchJson(backendUrl(`/api/dev/breezbook-gym/${locationId}/service/${service.id}/availability?${dateRange}&lang=${$language}`), {
				method: 'POST',
				body: JSON.stringify(options)
			});
			journeyState = initializeJourneyState(tenant, availableSlots.serviceId, locationId, requirementOverrides);
			showNoAvailabilityMessage = false;
		} catch (error) {
			// console.error({error})
			showNoAvailabilityMessage = true;
			journeyState = journeyStateFns.reset(journeyState);
		}
	});

	function slotSelected(event: CustomEvent<Slot>) {
		journeyState = { ...journeyState, selectedSlot: event.detail };
	}

	function onFormFilled(event: CustomEvent) {
		journeyState = journeyStateFns.formFilled(journeyState, event.detail);
	}

	function onCustomerDetailsFilled(event: CustomEvent<CoreCustomerDetails>) {
		journeyState = journeyStateFns.setCustomerDetails(journeyState, event.detail);
	}

	function onPaymentComplete() {
		journeyState = journeyStateFns.setPaid(journeyState);
	}
</script>
{#if journeyState}
	{#if journeyState.selectedSlot === null}
		<h3>{$translations.availabilityFor} {trainer.name}</h3>
		{#if showNoAvailabilityMessage}
			<p>{$translations.noSlotsAvailable}</p>
		{:else}
			<SelectSlot {availableSlots} {dayList} on:slotSelected={slotSelected} />
		{/if}
	{:else if journeyStateFns.requiresAddOns(journeyState) && !journeyStateFns.addOnsFilled(journeyState)}
		<p>Add-ons {JSON.stringify(journeyState.possibleAddOns)}</p>
	{:else if journeyStateFns.requiresForms(journeyState) && !journeyStateFns.formsFilled(journeyState)}
		<FillForm form={journeyStateFns.currentUnfilledForm(journeyState)} on:formFilled={onFormFilled} />
	{:else if !journeyStateFns.customerDetailsFilled(journeyState)}
		<FillCustomerDetails on:filled={onCustomerDetailsFilled} />
	{:else if !journeyStateFns.isPaid(journeyState)}
		<TakePayment state={journeyState} on:paymentComplete={onPaymentComplete} />
	{:else}
		<p>{$translations.thankYou}</p>
	{/if}
{/if}
