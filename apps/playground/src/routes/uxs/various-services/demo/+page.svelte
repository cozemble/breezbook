<script lang="ts">
    import {Calendar, Clock} from 'lucide-svelte';
    import {allConfigs, type SlotSelectionConfig, type Time, type Timeslot,} from "./timeSelection2";
    import {isoDate, type IsoDate, type TwentyFourHourClockTime} from "@breezbook/packages-types";
    import {allServices} from "./types2";
    import {toSlotSelectionConfig} from "./toSlotSelectionConfig";
    import SelectStartDate from "./SelectStartDate.svelte";
    import {formatDate} from "$lib/ui/time-picker/types.js";
    import SelectStartTime from "./SelectStartTime.svelte";

    let currentMonth: Date = new Date();
    let config: SlotSelectionConfig = toSlotSelectionConfig(currentMonth, allServices.mobileCarWash);

    let selectedStartDate: IsoDate | null = null;
    let selectedEndDate: IsoDate | null = null;
    let selectedStartTime: TwentyFourHourClockTime | null = null;
    let selectedEndTime: TwentyFourHourClockTime | null = null;

    $: availableStartTimes = selectedStartDate && config.startTime._type === 'pick-one'
        ? config.startTime.options.find(option => option.date.value === selectedStartDate?.value)?.times || []
        : [];

    $: availableEndTimes = selectedEndDate && config.endTime && config.endTime._type === 'end-time' && config.endTime.time._type === 'pick-one'
        ? config.endTime.time.options.find(option => option.date.value === selectedEndDate?.value)?.times || []
        : [];

    $: endDateOptions = config.endDate
        ? 'options' in config.endDate
            ? config.endDate.options.options
            : config.endDate._type === 'relative-end'
                ? [] // No selectable options for relative end
                : []
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
        const found = allConfigs.find(c => c.name === target.value);
        if (found) {
            config = found.config;
        } else {
            config = allConfigs[0].config;
        }
        selectedStartDate = null;
        selectedEndDate = null;
        selectedStartTime = null;
        selectedEndTime = null;
    }

    function onStartDateSelected(event: CustomEvent<Date>) {
        handleDateSelection(isoDate(formatDate(event.detail)), false);
    }

    function onStartTimeSelected(event: CustomEvent<Time | Timeslot>) {
        handleTimeSelection(event.detail.start, false);
    }
</script>

<div class="card bg-base-100 shadow-xl max-w-sm mx-auto">
    <div class="card-body p-4">
        <div class="form-control mb-4">
            <label class="label">Select service type</label>
            <select class="input-bordered input" on:change={onConfigChange}>
                {#each allConfigs as c}
                    <option value={c.name} selected={c.config === config}>{c.name}</option>
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
        <h2 class="card-title text-lg mb-4">Time slot selection</h2>

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
                <label class="label">
                    <span class="label-text font-semibold">Select Start Time</span>
                </label>
                {#if config.startTime._type === 'fixed-time'}
                    <div class="alert alert-info text-sm">
                        <Clock class="mr-1" size={14}/>
                        <span>{config.startTime.time.value} - {config.startTime.timeLabel}</span>
                    </div>
                {:else if config.startTime._type === 'pick-one'}
                    <div class="grid grid-cols-3 gap-2">
                        {#each availableStartTimes as time}
                            <SelectStartTime {time} selectedTime={selectedStartTime} on:clicked={onStartTimeSelected}/>
                        {/each}
                        {#if availableStartTimes.length === 0}
                            <div class="col-span-3 md:col-span-4 text-center text-xs opacity-70">
                                No available times
                            </div>
                        {/if}
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
                <div class="grid grid-cols-2 gap-2">
                    {#each endDateOptions as option}
                        <button
                                class="btn btn-sm btn-outline {option.disabled?.disabled ? 'btn-disabled' : ''} {selectedEndDate?.value === option.date.value ? 'btn-active' : ''}"
                                on:click={() => handleDateSelection(option.date, true)}
                                disabled={option.disabled?.disabled}
                                title={option.disabled?.reason}
                        >
                            <Calendar class="mr-1" size={14}/>
                            {option.date.value}
                        </button>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- End Time Selection (if applicable) -->
        {#if (selectedEndDate || (config.endDate?._type === 'relative-end' && selectedStartDate)) && config.endTime}
            <div class="form-control mb-4">
                <label class="label">
                    <span class="label-text font-semibold">Select End Time</span>
                </label>
                {#if config.endTime._type === 'fixed-time'}
                    <div class="alert alert-info text-sm">
                        <Clock class="mr-1" size={14}/>
                        <span>{config.endTime.time.value} - {config.endTime.timeLabel}</span>
                    </div>
                {:else if config.endTime._type === 'end-time' && config.endTime.time._type === 'pick-one'}
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
                {/if}
            </div>
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