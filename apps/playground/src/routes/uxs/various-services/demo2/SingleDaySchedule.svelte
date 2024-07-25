<script lang="ts">
    import type {
        AnyTimeBetween,
        DayConstraint,
        DurationOption,
        DurationRange,
        FixedDurationConfig,
        PickTime
    } from "./types3";
    import SelectStartDate from "./SelectStartDate.svelte";
    import {writable} from "svelte/store";
    import type {DurationReport, SelectableTimeOption, SingleDaySelection, TimeOption, Timeslot} from "./uiTypes";
    import {formatDate} from "$lib/ui/time-picker/types";
    import {durationFns, isoDate, time24Fns} from "@breezbook/packages-types";
    import PickStartTime from "./PickStartTime.svelte";
    import UserEnteredTime from "./UserEnteredTime.svelte";
    import {Clock} from "lucide-svelte";
    import {afterUpdate} from "svelte";
    import type {Duration} from "../demo/types2";
    import PrintDuration from "./PrintDuration.svelte";

    export let dayConstraints: DayConstraint[]
    export let times: FixedDurationConfig | PickTime | AnyTimeBetween
    export let duration: DurationOption | null = null
    export let state = writable({selectedDay: null, selectedTime: null} as SingleDaySelection)
    let calendarStartMonth = new Date();

    function changeStartMonth(months: number) {
        calendarStartMonth = new Date(calendarStartMonth.getFullYear(), calendarStartMonth.getMonth() + months, 1);
    }

    function onStartDateSelected(event: CustomEvent<Date>) {
        const selectedDay = isoDate(formatDate(event.detail))
        state.update(s => {
            const selectedTime = times._type === 'fixed-time' ? times : null
            return ({...s, selectedDay, selectedTime});
        })
    }

    function pickTimeCast(time: TimeOption | null): SelectableTimeOption | null {
        if (time === null) {
            return null
        }
        if (time._type === 'time') {
            return time
        }
        if (time._type === 'time-slot') {
            return time
        }
        throw new Error(`Unexpected time type: ${time._type}`)
    }

    function userSelectedTimeCast(time: TimeOption | null): SelectableTimeOption | null {
        if (time === null) {
            return null
        }
        if (time._type === 'time' || time._type === 'time-slot') {
            return time
        }
        throw new Error(`Unexpected time type: ${time._type}`)
    }

    function onStartTimeSelected(event: CustomEvent<SelectableTimeOption>) {
        state.update(s => ({...s, selectedTime: event.detail}))
    }

    function getActualDuration(duration: DurationRange, selectedTime: Timeslot): Duration {
        return durationFns.matchUnits(time24Fns.duration(selectedTime.start, selectedTime.end), duration.minDuration)
    }

    function validateDuration(duration: DurationOption | null, selectedTime: TimeOption | null): DurationReport | null {
        console.log({duration, selectedTime})
        if (duration === null || selectedTime === null || duration._type === 'duration' || selectedTime._type === 'time' || selectedTime._type === 'fixed-time') {
            return null
        }
        const actualDuration = durationFns.matchUnits(time24Fns.duration(selectedTime.start, selectedTime.end), duration.minDuration)
        const minDuration = duration.minDuration
        if (actualDuration.value.value < minDuration.value.value) {
            return {
                actualDuration,
                message: `Selected time slot is too short. Minimum duration is ${minDuration.value.value} ${minDuration.value._type}`
            }
        }
        if (duration.maxDuration) {
            const actualDurationInSameUnits = durationFns.matchUnits(actualDuration, duration.maxDuration)
            if (actualDurationInSameUnits.value.value > duration.maxDuration.value.value) {
                return {
                    actualDuration: actualDurationInSameUnits,
                    message: `Selected time slot is too long. Maximum duration is ${duration.maxDuration.value.value} ${duration.maxDuration.value._type}`
                }
            }
        }
        return null
    }

    $: durationReport = validateDuration(duration, $state.selectedTime)

    afterUpdate(() => {
        console.log({durationReport})
    })
</script>

<div class="card bg-base-100 shadow-xl max-w-sm mx-auto">
    <div class="card-body p-4">

        <!-- Start Date Selection -->
        <div class="form-control mb-4">
            <label class="label">
                <span class="label-text font-semibold">Select Start Date</span>
            </label>
            <SelectStartDate currentMonth={calendarStartMonth}
                             {dayConstraints}
                             selectedStartDate={$state.selectedDay}
                             on:prevMonth={() => changeStartMonth(-1)}
                             on:nextMonth={() => changeStartMonth(1)}
                             on:clicked={onStartDateSelected}/>
        </div>

        <!-- Start Time Selection -->
        {#if $state.selectedDay}
            <div class="form-control mb-4">
                {#if times._type === "timeslot-selection" || times._type === "pick-time"}
                    <PickStartTime {times}
                                   selectedStartDate={$state.selectedDay}
                                   selectedStartTime={pickTimeCast($state.selectedTime)}
                                   on:clicked={onStartTimeSelected}/>
                {:else if times._type === "any-time-between" && duration}
                    <UserEnteredTime from={times.from} to={times.to}
                                     selectedTime={userSelectedTimeCast($state.selectedTime)}
                                     duration={duration}
                                     on:timeSelected={onStartTimeSelected}/>
                {/if}
            </div>
        {/if}
        {#if $state.selectedTime}
            {#if $state.selectedTime._type === 'fixed-time'}
                <div class="form-control mb-4">
                    <div class="alert alert-info text-sm">
                        <Clock class="mr-1" size={14}/>
                        <span>{$state.selectedTime.start.value} - {$state.selectedTime.startLabel}</span>
                    </div>
                </div>

                <div class="form-control mb-4">
                    <div class="alert alert-info text-sm">
                        <Clock class="mr-1" size={14}/>
                        <span>{$state.selectedTime.end.value} - {$state.selectedTime.endLabel}</span>
                    </div>
                </div>
            {/if}
            {#if durationReport}
                <div class="form-control mb-4">
                    <div class="alert alert-error text-sm">
                        <Clock class="mr-1" size={14}/>
                        <span>{durationReport.message}</span>
                    </div>
                </div>
            {:else if duration}
                {#if duration._type === 'duration'}
                    <PrintDuration {duration}/>
                {:else if duration._type === 'duration-range' && $state.selectedTime._type === 'time-slot'}
                    <PrintDuration duration={getActualDuration(duration, $state.selectedTime)}/>
                {/if}
            {/if}

        {/if}
    </div>

</div>