<script lang="ts">
    import type {Availability, AvailabilityResponse} from "@breezbook/backend-api-types";
    import {type IsoDate, isoDateFns} from "@breezbook/packages-types";
    import {createEventDispatcher} from "svelte";
    import type {Slot} from "$lib/uxs/personal-training/journeyState";

    export let availableSlots: AvailabilityResponse
    export let dayList: IsoDate[]
    let selectedSlot: Slot | null = null
    const dispatch = createEventDispatcher()

    function slotsForDay(availableSlots: AvailabilityResponse, day: IsoDate): Availability[] {
        return availableSlots.slots[day.value] || []
    }

    function priceForDay(availableSlots: AvailabilityResponse, day: IsoDate): string {
        const priceInMinorUnits =  slotsForDay(availableSlots,day)?.[0]?.priceWithNoDecimalPlaces
        if(!priceInMinorUnits) {
            return ""
        }
        return `£ ${priceInMinorUnits / 100}`
    }

    function toggleTimeSelection(day: IsoDate, slot: Availability) {
        if (isSelectedSlot(selectedSlot, day, slot)) {
            selectedSlot = null
        } else {
            selectedSlot = {day, slot}
        }
    }

    function isSelectedSlot(selectedSlot: Slot | null, day: IsoDate, slot: Availability) {
        return selectedSlot && selectedSlot.day.value === day.value && selectedSlot.slot.startTime24hr === slot.startTime24hr
    }

    function confirm() {
        if(selectedSlot) {
            dispatch("slotSelected", selectedSlot)
        }
    }
</script>

<div class="flex">
    {#if availableSlots}
        {#each dayList as day}
            {@const slots = slotsForDay(availableSlots, day)}
            <div class="card p-2 ml-2 border">
                <h3><strong>{day.value} - {isoDateFns.dayOfWeek(day)}</strong></h3>
                {#each slots as slot}
                    <div on:click={() => toggleTimeSelection(day, slot)} class="border-success"
                         class:border={isSelectedSlot(selectedSlot,day,slot)}>
                        <p>{slot.startTime24hr}</p>
                    </div>
                {/each}
                {#if slots.length === 0}
                    <p class="mt-12">No slots available</p>
                {/if}
                <p class="mt-2">{priceForDay(availableSlots, day)}</p>
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
