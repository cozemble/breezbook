<script lang="ts">
    import {type TwentyFourHourClockTime} from "@breezbook/packages-date-time";
    import {type SelectableTimeOption, type Time, type Timeslot} from "./uiTypes";
    import UserEnteredStartTime from "./UserEnteredStartTime.svelte";
    import UserEnteredStartTimeslot from "./UserEnteredStartTimeslot.svelte";
    import type {DurationOption} from "./scheduleConfig";

    export let from: TwentyFourHourClockTime;
    export let to: TwentyFourHourClockTime;
    export let selectedTime: SelectableTimeOption | null = null;
    export let duration: DurationOption
    export let onStartTimeSelected: (time: SelectableTimeOption) => void

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

    function onTimeSelected(event: CustomEvent<SelectableTimeOption>) {
        onStartTimeSelected(event.detail)
    }
</script>

{#if duration._type === "duration"}
    <UserEnteredStartTime {from} {to} selectedTime={castAsTime(selectedTime)} on:timeSelected={onTimeSelected}/>
{:else}
    <UserEnteredStartTimeslot {from} {to} selectedTime={castAsTimeslot(selectedTime)} on:timeSelected={onTimeSelected}/>
{/if}
