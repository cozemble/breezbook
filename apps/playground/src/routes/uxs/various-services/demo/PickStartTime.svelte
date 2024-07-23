<script lang="ts">
    import type {PickTimeConfig} from "./timeSelection2";
    import type {IsoDate, TwentyFourHourClockTime} from "@breezbook/packages-types";
    import SelectStartTime from "./SelectStartTime.svelte";

    export let selectedStartDate: IsoDate | null = null;
    export let config: PickTimeConfig
    export let selectedStartTime: TwentyFourHourClockTime | null

    $: availableStartTimes = config.options.find(option => option.date.value === selectedStartDate?.value)?.times || []

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
