<script lang="ts">
    import {type IsoDate} from "@breezbook/packages-date-time";
    import DaySelector from "$lib/ui/time-picker/DaySelector.svelte";
    import {daysOfWeek} from "./uIConstants";
    import MonthSelector from "./MonthSelector.svelte";
    import {disabledEndDays} from "./toUiTypes";
    import type {DayConstraint, DayLength} from "./scheduleConfig";

    export let selectedStartDate: IsoDate
    export let selectedEndDate: IsoDate | null
    export let dayConstraints: DayConstraint[]
    export let length: DayLength
    let currentMonth: Date = new Date(selectedStartDate.value);

    $: selectedEndDateAsDate = selectedEndDate ? new Date(selectedEndDate.value) : null;
    $: disabledDays = disabledEndDays(currentMonth, selectedStartDate, length, dayConstraints);

    function changeStartMonth(months: number) {
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + months, 1);
    }

</script>

<div class="form-control mb-4">
    {#if length._type === 'variable-length'}
        <label class="label">
            <span class="label-text font-semibold">Select End Date</span>
        </label>
    {:else}
        <label class="label">
            <span class="label-text font-semibold">Fixed End Date</span>
        </label>
    {/if}

    <MonthSelector {currentMonth} on:prevMonth={() => changeStartMonth(-1)} on:nextMonth={() => changeStartMonth(1)}/>

    <div class="grid grid-cols-7 gap-2 text-center mb-2">
        {#each daysOfWeek as day}
            <div class="text-xs font-semibold opacity-70">{day}</div>
        {/each}
    </div>

    <div class="grid grid-cols-7 gap-2 text-center mb-2">
        <DaySelector {currentMonth} selectedDate={selectedEndDateAsDate} {disabledDays} on:clicked/>
    </div>
</div>