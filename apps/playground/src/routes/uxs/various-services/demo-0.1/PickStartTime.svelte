<script lang="ts">
    import type {PickTimeConfig} from "./timeSelectionUiTypes";
    import type {IsoDate, TwentyFourHourClockTime} from "@breezbook/packages-date-time";
    import SelectStartTime from "./SelectStartTime.svelte";
    import type {SchedulingOptions} from "./types2";
    import {getPossibleStartTimes} from "./toUiModel";

    export let selectedStartDate: IsoDate
    export let config: PickTimeConfig
    export let selectedStartTime: TwentyFourHourClockTime | null
    export let schedulingOptions: SchedulingOptions

    $: availableStartTimes = getPossibleStartTimes(selectedStartDate, schedulingOptions)
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
