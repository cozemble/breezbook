<script lang="ts">
    import type {PickTimeConfig, Time, Timeslot} from "./timeSelection2";
    import {dayAndTime, dayAndTimeFns, type IsoDate, type TwentyFourHourClockTime} from "@breezbook/packages-types";
    import {createEventDispatcher} from "svelte";
    import SelectEndTime from "./SelectEndTime.svelte";

    export let config: PickTimeConfig
    export let selectedStartTime: TwentyFourHourClockTime
    export let selectedStartDate: IsoDate
    export let selectedEndDate: IsoDate
    export let selectedEndTime: TwentyFourHourClockTime | null
    export let minDurationMinutes: number = 0
    export let maxDurationMinutes: number = -1
    const dispatch = createEventDispatcher();

    $: possibleStartTimes = config.options.find(option => option.date.value === selectedEndDate.value)?.times || []
    $: availableEndTimes = possibleStartTimes.filter(t => supportsDuration(t))

    function supportsDuration(t: Time | Timeslot): boolean {
        if (t._type === 'time-slot') {
            return true
        }
        const duration = calculateDurationInMinutes(t.start)
        return duration >= minDurationMinutes && (maxDurationMinutes === -1 || duration <= maxDurationMinutes)
    }

    function calculateDurationInMinutes(time:TwentyFourHourClockTime): number {
        const start = dayAndTime(selectedStartDate, selectedStartTime)
        const end = dayAndTime(selectedEndDate, time)
        const result = dayAndTimeFns.minutesBetween(start, end).value
        console.log({start,  result, minDurationMinutes})
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

<pre>
    {JSON.stringify(availableEndTimes, null, 2)}
</pre>