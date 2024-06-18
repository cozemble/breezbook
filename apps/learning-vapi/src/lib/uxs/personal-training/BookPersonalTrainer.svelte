<script lang="ts">
    import {
        type AnySuitableResource,
        type Availability,
        type AvailabilityResponse,
        type ResourceSummary
    } from "@breezbook/backend-api-types";
    import {onMount} from 'svelte';
    import {backendUrl, fetchJson} from "$lib/helpers";
    import {type IsoDate, isoDate, isoDateFns} from "@breezbook/packages-core";

    export let trainer: ResourceSummary
    export let locationId: string
    export let serviceId: string
    export let personalTrainerRequirement: AnySuitableResource
    let availableSlots: AvailabilityResponse
    const today = isoDate()
    const sevenDaysFromNow = isoDateFns.addDays(today, 7)
    const dayList = isoDateFns.listDays(today, sevenDaysFromNow)
    let selectedSlot: {day: IsoDate, slot: Availability} | null = null

    onMount(async () => {
        const dateRange = `fromDate=${today.value}&toDate=${sevenDaysFromNow.value}`
        const requirementOverrides = [{
            requirementId: personalTrainerRequirement.id.value,
            resourceId: trainer.id
        }]
        availableSlots = await fetchJson(backendUrl(`/api/dev/breezbook-gym/${locationId}/service/${serviceId}/availability?${dateRange}`), {
            method: "POST",
            body: JSON.stringify({requirementOverrides})
        })
    })

    function slotsForDay(availableSlots: AvailabilityResponse, day: { value: string }): Availability[] {
        return availableSlots.slots[day.value] || []
    }

    function toggleTimeSelection(day: IsoDate, slot: Availability) {
        if (isSelectedSlot(selectedSlot, day, slot)) {
            selectedSlot = null
        } else {
            selectedSlot = {day, slot}
        }
    }

    function isSelectedSlot(selectedSlot:{day: IsoDate, slot: Availability} | null = null,day: IsoDate, slot: Availability) {
        return selectedSlot && selectedSlot.day.value === day.value && selectedSlot.slot.startTime24hr === slot.startTime24hr
    }

    function confirm() {
        console.log('Confirming', selectedSlot)
    }
</script>

<div class="flex">
    {#if availableSlots}
        {#each dayList as day}
            {@const slots = slotsForDay(availableSlots, day)}
            <div class="card p-2 ml-2 border">
                <h3><strong>{day.value} - {isoDateFns.dayOfWeek(day)}</strong></h3>
                {#each slots as slot}
                    <div on:click={() => toggleTimeSelection(day, slot)} class="border-success" class:border={isSelectedSlot(selectedSlot,day,slot)}>
                        <p>{slot.startTime24hr}</p>
                    </div>
                {/each}
                {#if slots.length === 0}
                    <p class="mt-12">No slots available</p>
                {/if}
            </div>
        {/each}
    {/if}
</div>

{#if selectedSlot}
    <div class="mt-4">
        <h3>Selected slot</h3>
        <p>{selectedSlot.day.value} {selectedSlot.slot.startTime24hr}</p>
        <button class="btn btn-primary btn-lg" on:click={confirm}>Confirm</button>
    </div>
{/if}