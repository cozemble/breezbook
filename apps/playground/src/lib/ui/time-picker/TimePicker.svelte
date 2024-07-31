<script lang="ts">
    import {ChevronLeft, ChevronRight} from 'lucide-svelte';
    import {
        type DateLabels,
        type DateTimes,
        type DisabledDays,
        formatDate,
        type TimeLabels,
        type TimeString
    } from "./types";
    import TimeButton from "./TimeButton.svelte";
    import {createEventDispatcher} from "svelte";
    import DaySelector from "$lib/ui/time-picker/DaySelector.svelte";

    export let currentMonth: Date = new Date();
    export let selectedDate: Date | null = null;
    export let selectedTime: TimeString | null = null;
    export let dateLabels: DateLabels = {};
    export let dateTimes: DateTimes = {}
    export let timeLabels: TimeLabels = {};
    export let disabledDays: DisabledDays = {};

    const dispatch = createEventDispatcher();
    let timeFormat: '12h' | '24h' = '24h';

    function setTimeFormat(format: '12h' | '24h'): void {
        timeFormat = format;
    }

    function prevMonth(): void {
        changeMonth(-1)
    }

    function nextMonth(): void {
        changeMonth(1)
    }

    function changeMonth(delta: 1 | -1) {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
        dispatch('monthChanged', newMonth);
    }

    function handleDateSelect(date: Date | undefined): void {
        if (!date) {
            return;
        }
        const dateString = formatDate(date);
        const isDisabled = disabledDays[dateString] || false;
        if (!isDisabled) {
            dispatch('dateSelected', date);
        }
    }

    function handleTimeSelect(event: CustomEvent<TimeString>): void {
        dispatch('timeSelected', event.detail);
    }


    $: selectedDateString = selectedDate ? formatDate(selectedDate) : '';
    $: times = dateTimes[selectedDateString] || [];

    $: dayTimeLabels = timeLabels[selectedDateString] || {};

    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

    function onDateSelected(event: CustomEvent<Date>) {
        handleDateSelect(event.detail);
    }
</script>


<div class="card shadow-xl w-full max-w-screen-md mx-auto">
    <div class="card-body">
        <div class="flex justify-between items-center mb-4">
            <h2 class="card-title">
                {currentMonth.toLocaleString('default', {month: 'long', year: 'numeric'})}
            </h2>
            <div class="btn-group">
                <button on:click={prevMonth} class="btn btn-sm">
                    <ChevronLeft size={20}/>
                </button>
                <button on:click={nextMonth} class="btn btn-sm">
                    <ChevronRight size={20}/>
                </button>
            </div>
        </div>
        <div class="grid grid-cols-7 gap-2 text-center mb-2">
            {#each daysOfWeek as day}
                <div class="text-xs font-semibold opacity-70">{day}</div>
            {/each}
        </div>

        <div class="grid grid-cols-7 gap-2 mb-4">
            <DaySelector {currentMonth}
                         {selectedDate}
                         {disabledDays}
                         {dateLabels}
                         on:clicked={onDateSelected}/>
        </div>

        {#if selectedDate}
            <div class="mt-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">
                        {selectedDate.toLocaleString('default', {weekday: 'short', day: 'numeric'})}
                    </h3>
                    <div class="btn-group">
                        <button
                                on:click={() => setTimeFormat('12h')}
                                class={`btn btn-sm ${timeFormat === '12h' ? 'btn-primary' : ''}`}>
                            12h
                        </button>
                        <button
                                on:click={() => setTimeFormat('24h')}
                                class={`btn btn-sm ${timeFormat === '24h' ? 'btn-primary' : ''}`}>
                            24h
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {#each times as time}
                        <TimeButton time={time}
                                    {selectedTime}
                                    timeFormat={timeFormat}
                                    timeLabel={dayTimeLabels[time] || null}
                                    on:clicked={handleTimeSelect}/>
                    {/each}
                    {#if times.length === 0}
                        <div class="col-span-3 md:col-span-4 text-center text-xs opacity-70">
                            No available times
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>


