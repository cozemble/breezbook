<script lang="ts">
    import {time24, time24Fns, type TwentyFourHourClockTime} from "@breezbook/packages-date-time";
    import UserEnteredTimeSelector from "$lib/ui/time-picker/UserEnteredTimeSelector.svelte";
    import {createEventDispatcher} from "svelte";
    import {time, type Time} from "./uiTypes";

    export let from: TwentyFourHourClockTime;
    export let to: TwentyFourHourClockTime;
    export let selectedTime: Time | null = null;

    const dispatch = createEventDispatcher();

    $: startHour = time24Fns.getHour(from);
    $: endHour = time24Fns.getHour(to);
    $: hour = selectedTime ? time24Fns.getHour(selectedTime.start) : 0;
    $: minute = selectedTime ? time24Fns.getMinutes(selectedTime.start) : 0;

    function onTimeSelected(event: CustomEvent<string>) {
        dispatch('timeSelected', time(time24(event.detail)))
    }
</script>

<UserEnteredTimeSelector {startHour} {endHour} {hour} {minute} on:timeSelected={onTimeSelected}/>
