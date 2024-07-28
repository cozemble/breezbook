<script lang="ts">
    import SelectStartDate from "./SelectStartDate.svelte";
    import {derived, type Readable, writable} from "svelte/store";
    import {initialMultiDaySelection, type SelectableTimeOption, type Time, time} from "./uiTypes";
    import {type IsoDate, isoDate, time24Fns, type TwentyFourHourClockTime} from "@breezbook/packages-types";
    import {formatDate} from "$lib/ui/time-picker/types";
    import PickStartTime from "./PickStartTime.svelte";
    import {afterUpdate} from "svelte";
    import SelectEndDate from "./SelectEndDate.svelte";
    import PickEndTime from "./PickEndTime.svelte";
    import PrintFixedTime from "./PrintFixedTime.svelte";
    import UserEnteredStartTime from "./UserEnteredStartTime.svelte";
    import {
        type AnyTimeBetween,
        type DayConstraint,
        type DayLength, type FixedTime,
        type MultiDayEndTimeOptions,
        type MultiDayStartTimeOptions, type PickTime,
        timeOptionsFns
    } from "./scheduleConfig";

    export let startDayConstraints: DayConstraint[]
    export let endDayConstraints: DayConstraint[]
    export let startTimes: MultiDayStartTimeOptions
    export let endTimes: MultiDayEndTimeOptions | null
    export let length: DayLength
    export let state = writable(initialMultiDaySelection())

    const startTimeOptions: Readable<FixedTime | PickTime | AnyTimeBetween | null> = derived(state, s => maybeStartTimeOptions(s.startDate))
    const endTimeOptions: Readable<PickTime | AnyTimeBetween | null> = derived(state, s => maybeEndTimeOptions(s.startDate, s.endDate))

    function maybeStartTimeOptions(startDate: IsoDate | null) {
        return startDate ? timeOptionsFns.forDate(startTimes, startDate) : null;
    }

    function maybeEndTimeOptions(startDate: IsoDate | null, endDate: IsoDate | null) {
        if (!endDate) {
            return null
        }
        if (endTimes) {
            return timeOptionsFns.forDate(endTimes, endDate)
        }
        if (length._type === 'variable-length' && startDate) {
            const startTimes = maybeStartTimeOptions(startDate)
            if (startTimes?._type === 'pick-time' || startTimes?._type === 'any-time-between') {
                return startTimes
            }
        }
        return null
    }

    function maybeEndDate(startDate: IsoDate, length: DayLength): IsoDate | null {
        if (length._type === 'fixed-length') {
            return time24Fns.addDays(startDate, length.days.value - 1)
        }
        return null
    }

    function onStartDateSelected(event: CustomEvent<Date>) {
        const startDate = isoDate(formatDate(event.detail))
        state.update(s => {
            const startTimeOption = maybeStartTimeOptions(startDate)
            const endDate = maybeEndDate(startDate, length)
            const selectedTime = startTimeOption?._type === 'fixed-time' ? startTimeOption : null
            return ({...s, startDate, selectedStartTime: selectedTime, endDate});
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

    function onEndTimeSelected(time24: TwentyFourHourClockTime) {
        const theTime = time(time24)
        state.update(s => ({...s, selectedEndTime: theTime}))
    }

    function onStartTimeSelectedEvent(event: CustomEvent<Time>) {
        onStartTimeSelected(event.detail)
    }

    function onEndTimeSelectedEvent(event: CustomEvent<Time>) {
        onEndTimeSelected(event.detail.start)
    }

    afterUpdate(() => {
        console.log('state', $state)
        console.log('startTimeOptions', $startTimeOptions)
        console.log('endTimeOptions', $endTimeOptions)
    })
</script>

<div class="card bg-base-100 shadow-xl max-w-sm mx-auto">
    <div class="card-body p-4">
        <SelectStartDate
                dayConstraints={startDayConstraints}
                selectedStartDate={$state.startDate}
                on:clicked={onStartDateSelected}/>

        {#if $state.startDate && $startTimeOptions && $state.selectedStartTime?._type !== 'fixed-time'}
            {#if $startTimeOptions._type === "pick-time"}
                <PickStartTime
                        times={$startTimeOptions}
                        selectedStartDate={$state.startDate}
                        selectedStartTime={$state.selectedStartTime}
                        {onStartTimeSelected}/>
            {/if}
            {#if $startTimeOptions._type === "any-time-between"}
                <label class="label">
                    <span class="label-text font-semibold">Select Start Time</span>
                </label>
                <UserEnteredStartTime from={$startTimeOptions.from}
                                      to={$startTimeOptions.to}
                                      selectedTime={$state.selectedStartTime}
                                      on:timeSelected={onStartTimeSelectedEvent}/>
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

        {#if $state.startDate && $state.selectedStartTime && $state.endDate}
            {#if $endTimeOptions?._type === "pick-time"}
                <PickEndTime
                        times={$endTimeOptions}
                        selectedEndDate={$state.endDate}
                        selectedEndTime={$state.selectedEndTime}
                        {onEndTimeSelected}/>
            {/if}
            {#if $state.selectedStartTime._type === 'fixed-time'}
                <PrintFixedTime time={$state.selectedStartTime}/>
            {/if}
            {#if $endTimeOptions?._type === "any-time-between"}
                <label class="label">
                    <span class="label-text font-semibold">Select End Time</span>
                </label>
                <UserEnteredStartTime from={$endTimeOptions.from}
                                      to={$endTimeOptions.to}
                                      selectedTime={$state.selectedEndTime}
                                      on:timeSelected={onEndTimeSelectedEvent}/>
            {/if}
        {/if}
    </div>
</div>