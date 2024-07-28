<script lang="ts">
    import {type IsoDate, type TwentyFourHourClockTime} from "@breezbook/packages-types";
    import {getPossibleEndTimes} from "./toUiTypes";
    import SelectEndTime from "./SelectEndTime.svelte";
    import type {Time} from "./uiTypes";
    import type {PickTime} from "./scheduleConfig";

    export let times: PickTime
    export let selectedEndDate: IsoDate
    export let selectedEndTime: Time | null
    export let onEndTimeSelected: (time: TwentyFourHourClockTime) => void

    $: availableEndTimes = getPossibleEndTimes(selectedEndDate, times)

    function handleTimeSelection(event: CustomEvent<Time>) {
        onEndTimeSelected(event.detail.start)
    }
</script>

<label class="label">
    <span class="label-text font-semibold">Select End Time</span>
</label>

<div class="grid grid-cols-3 gap-2">
    {#each availableEndTimes as time}
        <SelectEndTime {time} selectedTime={selectedEndTime?.start} on:clicked={handleTimeSelection}/>
    {/each}
</div>

