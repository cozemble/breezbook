<script lang="ts">
    import type {IsoDate} from "@breezbook/packages-types";
    import {getPossibleStartTimes} from "./toUiTypes";
    import type {SelectableTimeOption} from "./uiTypes";
    import SelectStartTime from "./SelectStartTime.svelte";
    import type {PickTime, TimeslotSelection} from "./scheduleConfig";

    export let selectedStartDate: IsoDate
    export let selectedStartTime: SelectableTimeOption | null
    export let times: TimeslotSelection | PickTime
    export let onStartTimeSelected: (time: SelectableTimeOption) => void

    $: availableStartTimes = getPossibleStartTimes(selectedStartDate, times)

    function onClicked(event: CustomEvent<SelectableTimeOption>) {
        onStartTimeSelected(event.detail)
    }
</script>


<label class="label">
    <span class="label-text font-semibold">Select Start Time</span>
</label>

<div class="grid grid-cols-3 gap-2">
    {#each availableStartTimes as time}
        <SelectStartTime {time} selectedTime={selectedStartTime} on:clicked={onClicked}/>
    {/each}
    {#if availableStartTimes.length === 0}
        <div class="col-span-3 md:col-span-4 text-center text-xs opacity-70">
            No available times
        </div>
    {/if}
</div>
