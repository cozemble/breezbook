<script lang="ts">
    import {Clock} from 'lucide-svelte';
    import {type Time, type Timeslot} from "./timeSelection2";
    import {isoDate, type IsoDate, type TwentyFourHourClockTime} from "@breezbook/packages-types";
    import {allConfigs, type Service} from "./types2";
    import {toSlotSelectionConfig} from "./toSlotSelectionConfig";
    import SelectStartDate from "./SelectStartDate.svelte";
    import {formatDate} from "$lib/ui/time-picker/types.js";
    import {afterUpdate} from "svelte";
    import SelectEndDate from "./SelectEndDate.svelte";
    import UserEnteredTime from "./UserEnteredTime.svelte";
    import PickStartTime from "./PickStartTime.svelte";

    let currentMonth: Date = new Date();
    let service: Service = allConfigs[0].service;
    $: config = toSlotSelectionConfig(currentMonth, service);

    afterUpdate(() => {
        console.log({config})
    });

    let selectedStartDate: IsoDate | null = null;
    let selectedEndDate: IsoDate | null = null;
    let selectedStartTime: TwentyFourHourClockTime | null = null;
    let selectedEndTime: TwentyFourHourClockTime | null = null;

    $: availableEndTimes = selectedEndDate && config.endTime && config.endTime._type === 'end-time' && config.endTime.time._type === 'pick-one'
        ? config.endTime.time.options.find(option => option.date.value === selectedEndDate?.value)?.times || []
        : [];

    function calculateDurationInMinutes(start: TwentyFourHourClockTime, end: TwentyFourHourClockTime): number {
        const [startHours, startMinutes] = start.value.split(':').map(Number);
        const [endHours, endMinutes] = end.value.split(':').map(Number);
        return (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    }

    function handleDateSelection(date: IsoDate, isEndDate: boolean) {
        if (isEndDate) {
            selectedEndDate = date;
        } else {
            selectedStartDate = date;
            // Auto-select fixed start time if available
            if (config.startTime._type === 'fixed-time') {
                selectedStartTime = config.startTime.time;
            } else {
                selectedStartTime = null;
            }

            // Handle end date and time selection
            if (config.endDate?._type === 'relative-end') {
                const startDateObj = new Date(date.value);
                startDateObj.setDate(startDateObj.getDate() + config.endDate.numDays);
                selectedEndDate = {value: startDateObj.toISOString().split('T')[0]} as IsoDate;
            } else if (!config.endDate) {
                // If there's no separate end date, use the start date
                selectedEndDate = date;
            } else {
                selectedEndDate = null;
            }

            // Auto-select fixed end time if available
            if (config.endTime?._type === 'fixed-time') {
                selectedEndTime = config.endTime.time;
            } else {
                selectedEndTime = null;
            }
        }
    }

    function handleTimeSelection(time: TwentyFourHourClockTime, isEndTime: boolean) {
        if (isEndTime) {
            if (selectedStartTime && config.endTime?._type === 'end-time') {
                const duration = calculateDurationInMinutes(selectedStartTime, time);
                if (duration >= (config.endTime.minDurationMinutes ?? 0)) {
                    selectedEndTime = time;
                } else {
                    // Optionally, show an error message to the user
                    console.error(`Selected duration (${duration} minutes) is less than the minimum required (${config.endTime.minDurationMinutes} minutes)`);
                }
            }
        } else {
            selectedStartTime = time;
            // Reset end time when start time changes
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
            <SelectStartDate {currentMonth} options={config.startDate.options} {selectedStartDate}
                             on:clicked={onStartDateSelected}/>
        </div>

        <!-- Start Time Selection -->
        {#if selectedStartDate}
            <div class="form-control mb-4">
                {#if config.startTime._type === 'pick-one'}
                    <PickStartTime config={config.startTime} {selectedStartDate} {selectedStartTime}
                                   on:clicked={onStartTimeSelected}/>
                {:else if config.startTime._type === "user-selected-time-config"}
                    <label class="label">
                        <span class="label-text font-semibold">Enter Start Time</span>
                    </label>

                    <div>
                        <UserEnteredTime from={config.startTime.from} to={config.startTime.to}
                                         selectedTime={selectedStartTime} on:timeSelected={onStartTimeSelected}/>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- End Date Selection (if applicable) -->
        {#if selectedStartTime && config.endDate && config.endDate._type !== 'relative-end'}
            <div class="form-control mb-4">
                <label class="label">
                    <span class="label-text font-semibold">Select End Date</span>
                </label>
                <SelectEndDate {currentMonth} options={config.endDate.options.options} {selectedEndDate}
                               on:clicked={onEndDateSelected}/>
            </div>
        {/if}

        <!-- End Time Selection (if applicable) -->
        {#if (selectedEndDate || (config.endDate?._type === 'relative-end' && selectedStartDate)) && config.endTime}
            <div class="form-control mb-4">
                {#if config.endTime._type === 'end-time'}
                    {#if config.endTime.time._type === 'pick-one'}
                        <label class="label">
                            <span class="label-text font-semibold">Select End Time</span>
                        </label>

                        <div class="grid grid-cols-2 gap-2">
                            {#each availableEndTimes as time}
                                {@const duration = selectedStartTime ? calculateDurationInMinutes(selectedStartTime, time.start) : 0}
                                {@const isValidDuration = duration >= (config.endTime.minDurationMinutes ?? 0)}
                                <button
                                        class="btn btn-sm btn-outline {!isValidDuration || time.disabled?.disabled ? 'btn-disabled' : ''} {selectedEndTime?.value === time.start.value ? 'btn-active' : ''}"
                                        on:click={() => handleTimeSelection(time.start, true)}
                                        disabled={!isValidDuration || time.disabled?.disabled}
                                        title={!isValidDuration ? `Minimum duration: ${config.endTime.minDurationMinutes} minutes` : time.disabled?.reason}
                                >
                                    <div class="flex flex-col items-start text-xs">
                            <span class="flex items-center">
                                <Clock class="mr-1" size={12}/>
                                {time._type === 'time-slot' ? `${time.start.value} - ${time.end.value}` : time.start.value}
                            </span>
                                        {#if time._type === 'time-slot'}
                                            <span>{time.label}</span>
                                        {/if}
                                        {#if !isValidDuration}
                                            <span class="text-red-500">Too short</span>
                                        {/if}
                                    </div>
                                </button>
                            {/each}
                        </div>
                    {:else if config.endTime.time._type === 'user-selected-time-config'}
                        <label class="label">
                            <span class="label-text font-semibold">Enter End Time</span>
                        </label>

                        <div>
                            <UserEnteredTime from={config.endTime.time.from} to={config.endTime.time.to}
                                             selectedTime={selectedEndTime} on:timeSelected={onEndTimeSelected}/>
                        </div>
                    {/if}
                {/if}
            </div>
        {/if}

        {#if config.startTime._type === 'fixed-time' }
            {#if config.endTime?._type === 'fixed-time'}
                {#if selectedStartDate && selectedEndDate}
                    <div class="form-control mb-4">
                        {#if config.startTime._type === 'fixed-time'}
                            <div class="alert alert-info text-sm">
                                <Clock class="mr-1" size={14}/>
                                <span>{config.startTime.time.value} - {config.startTime.timeLabel}</span>
                            </div>
                        {/if}
                    </div>
                    <div class="form-control mb-4">
                        {#if config.endTime._type === 'fixed-time'}
                            <div class="alert alert-info text-sm">
                                <Clock class="mr-1" size={14}/>
                                <span>{config.endTime.time.value} - {config.endTime.timeLabel}</span>
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