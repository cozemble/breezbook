<script lang="ts">
    import {
        type AnyTimeBetween,
        type DayConstraint,
        type DayLength,
        type FixedTime,
        type MultiDayStartTimeOptions,
        type PickTime,
        timeOptionsFns
    } from "./types3";
    import SelectStartDate from "./SelectStartDate.svelte";
    import {derived, type Readable, writable} from "svelte/store";
    import {initialMultiDaySelection, type SelectableTimeOption} from "./uiTypes";
    import {type IsoDate, isoDate} from "@breezbook/packages-types";
    import {formatDate} from "$lib/ui/time-picker/types";
    import PickStartTime from "./PickStartTime.svelte";
    import {afterUpdate} from "svelte";
    import SelectEndDate from "./SelectEndDate.svelte";

    export let startDayConstraints: DayConstraint[]
    export let endDayConstraints: DayConstraint[]
    export let startTimes: MultiDayStartTimeOptions
    export let length: DayLength
    export let state = writable(initialMultiDaySelection())

    const startTimeOptions: Readable<FixedTime | PickTime | AnyTimeBetween | null> = derived(state, s => maybeStartTimeOptions(s.startDate))

    function maybeStartTimeOptions(startDate: IsoDate | null) {
        return startDate ? timeOptionsFns.forDate(startTimes, startDate) : null;
    }

    function onStartDateSelected(event: CustomEvent<Date>) {
        const startDate = isoDate(formatDate(event.detail))
        state.update(s => {
            const startTimeOption = maybeStartTimeOptions(startDate)
            const selectedTime = startTimeOption?._type === 'fixed-time' ? startTimeOption : null
            return ({...s, startDate, selectedStartTime: selectedTime});
        })
    }

    function onEndDateSelected(event: CustomEvent<Date>) {
        const endDate = isoDate(formatDate(event.detail))
        state.update(s => ({...s, endDate}));
    }

    function onStartTimeSelected(time: SelectableTimeOption) {
        if (time._type === 'time-slot') {
            throw new Error(`Unexpected time type: ${time._type}`)
        }
        state.update(s => ({...s, selectedStartTime: time}))
    }

    afterUpdate(() => {
        console.log('state', $state)
        console.log('startTimeOptions', $startTimeOptions)
    })
</script>

<div class="card bg-base-100 shadow-xl max-w-sm mx-auto">
    <div class="card-body p-4">
        <SelectStartDate
                dayConstraints={startDayConstraints}
                selectedStartDate={$state.startDate}
                on:clicked={onStartDateSelected}/>

        {#if $state.startDate && $startTimeOptions}
            {#if $startTimeOptions._type === "pick-time" && $state.selectedStartTime?._type !== 'fixed-time'}
                <PickStartTime
                        times={$startTimeOptions}
                        selectedStartDate={$state.startDate}
                        selectedStartTime={$state.selectedStartTime}
                        {onStartTimeSelected}/>
            {/if}
        {/if}

        {#if $state.startDate && $state.selectedStartTime}
            <SelectEndDate
                    dayConstraints={endDayConstraints}
                    {length}
                    selectedStartDate={$state.startDate}
                    selectedEndDate={$state.endDate}
                    on:clicked={onEndDateSelected}/>
        {/if}
    </div>
</div>