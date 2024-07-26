<script lang="ts">
    import type {Time, Timeslot} from "./timeSelectionUiTypes";
    import TimeButton from "$lib/ui/time-picker/TimeButton.svelte";
    import type {TwentyFourHourClockTime} from "@breezbook/packages-types";
    import {createEventDispatcher} from "svelte";

    export let time: Time | Timeslot
    export let selectedTime: TwentyFourHourClockTime | null = null;
    let timeFormat: '12h' | '24h' = '24h';
    const dispatch = createEventDispatcher();

    $: timeString = time._type === 'time-slot' ? `${time.start.value} - ${time.end.value}` : time.start.value
    $: timeLabel = time._type === 'time-slot' ? time.label : null
    $: selectedTimeString = selectedTime && timeString.startsWith(selectedTime.value) ? timeString : null

    function onClicked() {
        dispatch('clicked', time)
    }
</script>

<TimeButton time={timeString}
            selectedTime={selectedTimeString}
            {timeFormat}
            {timeLabel}
            on:clicked={onClicked}/>
