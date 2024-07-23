<script lang="ts">
    import {time24, time24Fns, type TwentyFourHourClockTime} from "@breezbook/packages-types";
    import UserEnteredTimeSelector from "$lib/ui/time-picker/UserEnteredTimeSelector.svelte";
    import {createEventDispatcher} from "svelte";
    import {time} from "./timeSelection2";

    export let from: TwentyFourHourClockTime;
    export let to: TwentyFourHourClockTime;
    export let selectedTime: TwentyFourHourClockTime | null = null;

    const dispatch = createEventDispatcher();

    $: startHour = time24Fns.getHour(from);
    $: endHour = time24Fns.getHour(to);
    $: hour = selectedTime ? time24Fns.getHour(selectedTime) : 0;
    $: minute = selectedTime ? time24Fns.getMinutes(selectedTime) : 0;

    function onTimeSelected(event: CustomEvent<string>) {
        dispatch('timeSelected', time(time24(event.detail)))
    }
</script>

<UserEnteredTimeSelector {startHour} {endHour} {hour} {minute} on:timeSelected={onTimeSelected}/>
