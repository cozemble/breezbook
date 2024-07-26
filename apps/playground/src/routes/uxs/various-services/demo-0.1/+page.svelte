<script lang="ts">
    import {Clock} from 'lucide-svelte';
    import {type Time, type Timeslot} from "./timeSelectionUiTypes";
    import {isoDate, type IsoDate, minutes, type TwentyFourHourClockTime} from "@breezbook/packages-types";
    import {allConfigs, duration} from "./types2";
    import SelectStartDate from "./SelectStartDate.svelte";
    import {formatDate} from "$lib/ui/time-picker/types.js";
    import {afterUpdate} from "svelte";
    import SelectEndDate from "./SelectEndDate.svelte";
    import UserEnteredTime from "./UserEnteredTime.svelte";
    import PickStartTime from "./PickStartTime.svelte";
    import PickEndTime from "./PickEndTime.svelte";
    import {toUiModel} from "./toUiModel";

    let calendarStartMonth: Date = new Date();
    let calendarEndMonth: Date = new Date();
    let service = allConfigs[0].service;
    $: uiModel = toUiModel(service);

    afterUpdate(() => {
        console.log({uiModel})
    });

    let selectedStartDate: IsoDate | null = null;
    let selectedEndDate: IsoDate | null = null;
    let selectedStartTime: TwentyFourHourClockTime | null = null;
    let selectedEndTime: TwentyFourHourClockTime | null = null;

    function handleDateSelection(date: IsoDate, isEndDate: boolean) {
        if (isEndDate) {
            selectedEndDate = date;
        } else {
            selectedStartDate = date;
            // Auto-select fixed start time if available
            if (uiModel.startTime._type === 'fixed-time') {
                selectedStartTime = uiModel.startTime.time;
            } else {
                selectedStartTime = null;
            }

            // Handle end date and time selection
            if (uiModel.endDate?._type === 'relative-end') {
                const startDateObj = new Date(date.value);
                startDateObj.setDate(startDateObj.getDate() + uiModel.endDate.numDays);
                selectedEndDate = {value: startDateObj.toISOString().split('T')[0]} as IsoDate;
            } else if (!uiModel.endDate) {
                // If there's no separate end date, use the start date
                selectedEndDate = date;
            } else {
                selectedEndDate = null;
            }

            // Auto-select fixed end time if available
            if (uiModel.endTime?._type === 'fixed-time') {
                selectedEndTime = uiModel.endTime.time;
            } else {
                selectedEndTime = null;
            }
        }
    }

    function handleTimeSelection(time: TwentyFourHourClockTime, isEndTime: boolean) {
        if (isEndTime) {
            selectedEndTime = time;
        } else {
            selectedStartTime = time;
            selectedEndTime = null;
        }
    }

    function onConfigChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const found = allConfigs.find(c => c.service.name === target.value);
        if (found) {
            service = found.service;
        }
        selectedStartDate = null;
        selectedEndDate = null;
        selectedStartTime = null;
        selectedEndTime = null;
    }

    function onStartDateSelected(event: CustomEvent<Date>) {
        handleDateSelection(isoDate(formatDate(event.detail)), false);
    }

    function onEndDateSelected(event: CustomEvent<Date>) {
        handleDateSelection(isoDate(formatDate(event.detail)), true);
    }

    function onStartTimeSelected(event: CustomEvent<Time | Timeslot>) {
        handleTimeSelection(event.detail.start, false);
    }

    function onEndTimeSelected(event: CustomEvent<Time | Timeslot>) {
        handleTimeSelection(event.detail.start, true);
    }

    function changeStartMonth(delta: number) {
        calendarStartMonth = new Date(calendarStartMonth.getFullYear(), calendarStartMonth.getMonth() + delta, 1);
        selectedStartDate = null;
        selectedEndDate = null;
        selectedStartTime = null;
        selectedEndTime = null;
    }

    function changeEndMonth(delta: number) {
        calendarEndMonth = new Date(calendarEndMonth.getFullYear(), calendarEndMonth.getMonth() + delta, 1);
        selectedEndDate = null;
        selectedEndTime = null;
    }
</script>

<div class="card bg-base-100 shadow-xl max-w-sm mx-auto">
    <div class="card-body p-4">
        <div class="form-control mb-4">
            <label class="label">Select service type</label>
            <select class="input-bordered input" on:change={onConfigChange}>
                {#each allConfigs as c}
                    <option value={c.service.name} selected={c.service === service}>{c.service.name}</option>
                {/each}
            </select>
        </div>

        <!--        <div class="form-control mb-4">-->
        <!--            <label class="label">Configuration definition</label>-->
        <!--            <pre>{JSON.stringify(definition, null, 2)}</pre>-->
        <!--        </div>-->
    </div>
</div>

<div class="card bg-base-100 shadow-xl max-w-sm mx-auto">
    <div class="card-body p-4">

        <!-- Start Date Selection -->
        <div class="form-control mb-4">
            <label class="label">
                <span class="label-text font-semibold">Select Start Date</span>
            </label>
            <SelectStartDate currentMonth={calendarStartMonth}
                             schedulingOptions={service.schedulingOptions}
                             {selectedStartDate}
                             on:prevMonth={() => changeStartMonth(-1)}
                             on:nextMonth={() => changeStartMonth(1)}
                             on:clicked={onStartDateSelected}/>
        </div>

        <!-- Start Time Selection -->
        {#if selectedStartDate}
            <div class="form-control mb-4">
                {#if uiModel.startTime._type === 'pick-time-config'}
                    <PickStartTime config={uiModel.startTime}
                                   {selectedStartDate}
                                   {selectedStartTime}
                                   schedulingOptions={service.schedulingOptions}
                                   on:clicked={onStartTimeSelected}/>
                {:else if uiModel.startTime._type === "user-selected-time-config"}
                    <label class="label">
                        <span class="label-text font-semibold">Enter Start Time</span>
                    </label>

                    <div>
                        <UserEnteredTime from={uiModel.startTime.from}
                                         to={uiModel.startTime.to}
                                         selectedTime={selectedStartTime}
                                         on:timeSelected={onStartTimeSelected}/>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- End Date Selection (if applicable) -->
        {#if selectedStartTime && selectedStartDate && uiModel.endDate && uiModel.endDate._type !== 'relative-end'}
            <div class="form-control mb-4">
                <label class="label">
                    <span class="label-text font-semibold">Select End Date</span>
                </label>
                <SelectEndDate currentMonth={calendarEndMonth}
                               {selectedEndDate}
                               {selectedStartDate}
                               schedulingOptions={service.schedulingOptions}
                               on:prevMonth={() => changeEndMonth(-1)}
                               on:nextMonth={() => changeEndMonth(1)}
                               on:clicked={onEndDateSelected}/>
            </div>
        {/if}

        <!-- End Time Selection (if applicable) -->
        {#if selectedEndDate && selectedStartTime && selectedStartDate && uiModel.endTime}
            <div class="form-control mb-4">
                {#if uiModel.endTime._type === 'pick-time-config'}
                    <PickEndTime config={uiModel.endTime}
                                 {selectedStartTime}
                                 {selectedStartDate}
                                 {selectedEndDate}
                                 {selectedEndTime}
                                 schedulingOptions={service.schedulingOptions}
                                 minDuration={uiModel.minDuration ?? duration(minutes(0))}
                                 maxDuration={uiModel.maxDuration ?? null}
                                 on:clicked={onEndTimeSelected}/>
                {:else if uiModel.endTime._type === 'user-selected-time-config'}
                    <label class="label">
                        <span class="label-text font-semibold">Enter End Time</span>
                    </label>

                    <div>
                        <UserEnteredTime from={uiModel.endTime.from} to={uiModel.endTime.to}
                                         selectedTime={selectedEndTime} on:timeSelected={onEndTimeSelected}/>
                    </div>
                {/if}
            </div>
        {/if}

        {#if uiModel.startTime._type === 'fixed-time' }
            {#if uiModel.endTime?._type === 'fixed-time'}
                {#if selectedStartDate && selectedEndDate}
                    <div class="form-control mb-4">
                        {#if uiModel.startTime._type === 'fixed-time'}
                            <div class="alert alert-info text-sm">
                                <Clock class="mr-1" size={14}/>
                                <span>{uiModel.startTime.time.value} - {uiModel.startTime.timeLabel}</span>
                            </div>
                        {/if}
                    </div>
                    <div class="form-control mb-4">
                        {#if uiModel.endTime._type === 'fixed-time'}
                            <div class="alert alert-info text-sm">
                                <Clock class="mr-1" size={14}/>
                                <span>{uiModel.endTime.time.value} - {uiModel.endTime.timeLabel}</span>
                            </div>
                        {/if}
                    </div>
                {/if}
            {/if}
        {/if}

        <!-- Selected Values Display -->
        {#if selectedStartDate || selectedEndDate || selectedStartTime || selectedEndTime}
            <div class="divider my-2"></div>
            <div class="alert alert-success text-sm">
                <h3 class="font-bold mb-1">Selected Values:</h3>
                {#if selectedStartDate}
                    <p>Start Date: {selectedStartDate.value}</p>
                {/if}
                {#if selectedStartTime}
                    <p>Start Time: {selectedStartTime.value}</p>
                {/if}
                {#if selectedEndDate}
                    <p>End Date: {selectedEndDate.value}</p>
                {/if}
                {#if selectedEndTime}
                    <p>End Time: {selectedEndTime.value}</p>
                {/if}
            </div>
        {/if}
    </div>
</div>
