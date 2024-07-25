<script lang="ts">
    // import type {PickTimeConfig} from "./timeSelectionUiTypes";
    import type {IsoDate, TwentyFourHourClockTime} from "@breezbook/packages-types";
    import type {
        AnyTimeBetween,
        FixedDurationConfig,
        PickTime,
        TimeslotSelection,
        VariableDurationConfig
    } from "./types3";
    import type {TimeslotSpec} from "@breezbook/packages-core";
    import {getPossibleStartTimes} from "./toUiTypes";
    import type {SelectableTimeOption} from "./uiTypes";
    import SelectStartTime from "./SelectStartTime.svelte";

    export let selectedStartDate: IsoDate
    export let selectedStartTime: SelectableTimeOption | null
    export let times: TimeslotSelection | PickTime


    $: availableStartTimes = getPossibleStartTimes(selectedStartDate, times)
</script>


<label class="label">
    <span class="label-text font-semibold">Select Start Time</span>
</label>

<div class="grid grid-cols-3 gap-2">
    {#each availableStartTimes as time}
        <SelectStartTime {time} selectedTime={selectedStartTime} on:clicked/>
    {/each}
    {#if availableStartTimes.length === 0}
        <div class="col-span-3 md:col-span-4 text-center text-xs opacity-70">
            No available times
        </div>
    {/if}
</div>
