<script lang="ts">
    // import type {Time, Timeslot} from "./timeSelectionUiTypes";
    import {createEventDispatcher} from "svelte";
    import type {SelectableTimeOption} from "./uiTypes";
    import TimeButton from "$lib/ui/time-picker/TimeButton.svelte";

    export let time: SelectableTimeOption
    export let selectedTime: SelectableTimeOption | null = null;
    let timeFormat: '12h' | '24h' = '24h';
    const dispatch = createEventDispatcher();

    $: timeString = time._type === 'time-slot' ? `${time.start.value} - ${time.end.value}` : time.start.value
    $: timeLabel = time._type === 'time-slot' ? time.label : null
    $: selectedTimeString = selectedTime && timeString.startsWith(selectedTime.start.value) ? timeString : null

    function onClicked() {
        dispatch('clicked', time)
    }
</script>

<TimeButton time={timeString}
            selectedTime={selectedTimeString}
            {timeFormat}
            {timeLabel}
            on:clicked={onClicked}/>
