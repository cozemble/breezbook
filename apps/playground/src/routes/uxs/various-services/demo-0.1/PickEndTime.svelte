<script lang="ts">
    import type {PickTimeConfig, Time, Timeslot} from "./timeSelectionUiTypes";
    import {dayAndTime, dayAndTimeFns, type IsoDate, type TwentyFourHourClockTime} from "@breezbook/packages-date-time";
    import {createEventDispatcher} from "svelte";
    import SelectEndTime from "./SelectEndTime.svelte";
    import {type Duration, durationFns, type SchedulingOptions} from "./types2";
    import {getPossibleEndTimes} from "./toUiModel";

    export let config: PickTimeConfig
    export let selectedStartTime: TwentyFourHourClockTime
    export let selectedStartDate: IsoDate
    export let selectedEndDate: IsoDate
    export let selectedEndTime: TwentyFourHourClockTime | null
    export let minDuration: Duration
    export let maxDuration: Duration | null = null
    export let schedulingOptions: SchedulingOptions
    const dispatch = createEventDispatcher();
    const minDurationMinutes = durationFns.toMinutes(minDuration).value
    const maxDurationMinutes = maxDuration ? durationFns.toMinutes(maxDuration).value : -1

    $: possibleStartTimes = getPossibleEndTimes(selectedEndDate, schedulingOptions)

    $: availableEndTimes = possibleStartTimes.filter(t => supportsDuration(t))

    function supportsDuration(t: Time | Timeslot): boolean {
        if (t._type === 'time-slot') {
            return true
        }
        const duration = calculateDurationInMinutes(t.start)
        return duration >= minDurationMinutes && (maxDurationMinutes === -1 || duration <= maxDurationMinutes)
    }

    function calculateDurationInMinutes(time: TwentyFourHourClockTime): number {
        const start = dayAndTime(selectedStartDate, selectedStartTime)
        const end = dayAndTime(selectedEndDate, time)
        const result = dayAndTimeFns.minutesBetween(start, end).value
        return result
    }

    function handleTimeSelection(event: CustomEvent<Time | Timeslot>) {
        dispatch('timeSelected', event.detail)
    }
</script>

<label class="label">
    <span class="label-text font-semibold">Select End Time</span>
</label>

<div class="grid grid-cols-3 gap-2">
    {#each availableEndTimes as time}
        <SelectEndTime {time} selectedTime={selectedEndTime} on:clicked={handleTimeSelection}/>
    {/each}
</div>

