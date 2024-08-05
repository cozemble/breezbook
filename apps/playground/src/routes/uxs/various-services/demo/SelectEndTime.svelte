<script lang="ts">
    // import type {Time, Timeslot} from "./timeSelectionUiTypes";
    import TimeButton from "$lib/ui/time-picker/TimeButton.svelte";
    import type {TwentyFourHourClockTime} from "@breezbook/packages-date-time";
    import {createEventDispatcher} from "svelte";
    import type {Time} from "./uiTypes";

    export let time: Time
    export let selectedTime: TwentyFourHourClockTime | null = null;
    let timeFormat: '12h' | '24h' = '24h';
    const dispatch = createEventDispatcher();

    $: timeString =  time.start.value
    $: selectedTimeString = selectedTime && timeString.startsWith(selectedTime.value) ? timeString : null

    function onClicked() {
        dispatch('clicked', time)
    }
</script>

<TimeButton time={timeString}
            selectedTime={selectedTimeString}
            {timeFormat}
            on:clicked={onClicked}/>
