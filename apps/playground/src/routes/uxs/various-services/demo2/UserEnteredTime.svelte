<script lang="ts">
    import {type TwentyFourHourClockTime} from "@breezbook/packages-types";
    import {type SelectableTimeOption, type Time, type Timeslot} from "./uiTypes";
    import type {DurationOption} from "./types3";
    import UserEnteredStartTime from "./UserEnteredStartTime.svelte";
    import UserEnteredStartTimeslot from "./UserEnteredStartTimeslot.svelte";

    export let from: TwentyFourHourClockTime;
    export let to: TwentyFourHourClockTime;
    export let selectedTime: SelectableTimeOption | null = null;
    export let duration: DurationOption

    function castAsTime(time: SelectableTimeOption | null): Time | null {
        if (time === null) {
            return null
        }
        if (time._type === 'time') {
            return time
        }
        throw new Error(`Unexpected time type: ${time._type}`)
    }

    function castAsTimeslot(time: SelectableTimeOption | null): Timeslot | null {
        if (time === null) {
            return null
        }
        if (time._type === 'time-slot') {
            return time
        }
        throw new Error(`Unexpected time type: ${time._type}`)
    }
</script>

{#if duration._type === "duration"}
    <UserEnteredStartTime {from} {to} selectedTime={castAsTime(selectedTime)} on:timeSelected/>
{:else}
    <UserEnteredStartTimeslot {from} {to} selectedTime={castAsTimeslot(selectedTime)} on:timeSelected/>
{/if}
