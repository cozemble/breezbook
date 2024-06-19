<script lang="ts">
    import {
        type AnySuitableResource,
        type AvailabilityResponse,
        type ResourceSummary,
        type Service
    } from "@breezbook/backend-api-types";
    import {onMount} from 'svelte';
    import {backendUrl, fetchJson} from "$lib/helpers";
    import {isoDate, isoDateFns} from "@breezbook/packages-core";
    import SelectSlot from "$lib/uxs/personal-training/SelectSlot.svelte";
    import {
        type CoreCustomerDetails,
        initialJourneyState,
        type JourneyState,
        type Slot
    } from "$lib/uxs/personal-training/journeyState";
    import {journeyStateFns} from "$lib/uxs/personal-training/journeyState.js";
    import FillForm from "$lib/uxs/personal-training/FillForm.svelte";
    import FillCustomerDetails from "$lib/uxs/personal-training/FillCustomerDetails.svelte";

    export let trainer: ResourceSummary
    export let locationId: string
    export let service: Service
    export let personalTrainerRequirement: AnySuitableResource
    let availableSlots: AvailabilityResponse
    const today = isoDate()
    const sevenDaysFromNow = isoDateFns.addDays(today, 7)
    const dayList = isoDateFns.listDays(today, sevenDaysFromNow)
    let journeyState: JourneyState

    onMount(async () => {
        const dateRange = `fromDate=${today.value}&toDate=${sevenDaysFromNow.value}`
        const requirementOverrides = [{
            requirementId: personalTrainerRequirement.id.value,
            resourceId: trainer.id
        }]
        availableSlots = await fetchJson(backendUrl(`/api/dev/breezbook-gym/${locationId}/service/${service.id}/availability?${dateRange}`), {
            method: "POST",
            body: JSON.stringify({requirementOverrides})
        })
        journeyState = initialJourneyState(availableSlots)
    })

    function slotSelected(event: CustomEvent<Slot>) {
        journeyState = {...journeyState, selectedSlot: event.detail}
    }

    function onFormFilled(event: CustomEvent) {
        journeyState = journeyStateFns.formFilled(journeyState, event.detail)
    }

    function onCustomerDetailsFilled(event: CustomEvent<CoreCustomerDetails>) {
        journeyState = journeyStateFns.setCustomerDetails(journeyState, event.detail)
    }
</script>
{#if journeyState}
    {#if journeyState.selectedSlot === null}
        <h3>Availability for {trainer.name}</h3>
        <SelectSlot {availableSlots} {dayList} on:slotSelected={slotSelected}/>
    {:else if journeyStateFns.requiresAddOns(journeyState) && !journeyStateFns.addOnsFilled(journeyState)}
        <p>Add-ons {JSON.stringify(journeyState.possibleAddOns)}</p>
    {:else if journeyStateFns.requiresForms(journeyState) && !journeyStateFns.formsFilled(journeyState)}
        <FillForm form={journeyStateFns.currentUnfilledForm(journeyState)} on:formFilled={onFormFilled}/>
    {:else if !journeyStateFns.customerDetailsFilled(journeyState)}
        <FillCustomerDetails on:filled={onCustomerDetailsFilled}/>
    {:else}
        <p>Booking summary</p>
    {/if}
{/if}
