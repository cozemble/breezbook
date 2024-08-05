<script lang="ts">
    import {time24, time24Fns, type TwentyFourHourClockTime} from "@breezbook/packages-date-time";
    import UserEnteredTimeSelector from "$lib/ui/time-picker/UserEnteredTimeSelector.svelte";
    import {createEventDispatcher} from "svelte";
    import {timeslot, type Timeslot} from "./uiTypes";

    export let from: TwentyFourHourClockTime;
    export let to: TwentyFourHourClockTime;
    export let selectedTime: Timeslot | null = null;
    let startTime: TwentyFourHourClockTime | null = null;
    let endTime: TwentyFourHourClockTime | null = null;

    function setStartAndEndTime(t: Timeslot | null) {
        if (t === null) {
            startTime = null;
            endTime = null;
        } else {
            startTime = t.start;
            endTime = t.end;
        }
    }

    const dispatch = createEventDispatcher();

    $: setStartAndEndTime(selectedTime);
    $: startHour = time24Fns.getHour(from);
    $: endHour = time24Fns.getHour(to);
    $: startHourInt = startTime ? time24Fns.getHour(startTime) : 0;
    $: startMinuteInt = startTime ? time24Fns.getMinutes(startTime) : 0;
    $: endHourInt = endTime ? time24Fns.getHour(endTime) : 0;
    $: endMinuteInt = endTime ? time24Fns.getMinutes(endTime) : 0;

    function onStartTimeSelected(event: CustomEvent<string>) {
        startTime = time24(event.detail);
    }

    function onEndTimeSelected(event: CustomEvent<string>) {
        endTime = time24(event.detail);
        if(startTime && endTime) {
            dispatch('timeSelected', timeslot(startTime, endTime, `${startTime.value} - ${endTime.value}`));
        }
    }
</script>

<label class="label">
    <span class="label-text font-semibold">Select Start Time</span>
</label>

<UserEnteredTimeSelector {startHour} {endHour} hour={startHourInt} minute={startMinuteInt}
                         on:timeSelected={onStartTimeSelected}/>

<label class="label mt-4">
    <span class="label-text font-semibold">Select End Time</span>
</label>

<UserEnteredTimeSelector {startHour} {endHour} hour={endHourInt} minute={endMinuteInt}
                         on:timeSelected={onEndTimeSelected}/>
