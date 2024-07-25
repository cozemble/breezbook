<script lang="ts">
    import {type IsoDate, isoDateFns} from "@breezbook/packages-types";
    import DaySelector from "$lib/ui/time-picker/DaySelector.svelte";
    import {daysOfWeek} from "./uIConstants";
    import MonthSelector from "./MonthSelector.svelte";
    import type {DayConstraint, DayLength} from "./types3";
    import {disabledEndDays} from "./toUiTypes";

    export let selectedStartDate: IsoDate
    export let selectedEndDate: IsoDate | null
    export let dayConstraints: DayConstraint[]
    export let length: DayLength
    let currentMonth: Date = new Date(selectedStartDate.value);

    $: selectedEndDateAsDate = selectedEndDate ? new Date(selectedEndDate.value) : null;
    $: disabledDays = disabledEndDays(currentMonth, selectedStartDate, length,dayConstraints);

    function changeStartMonth(months: number) {
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + months, 1);
    }

</script>

<div class="form-control mb-4">
    <label class="label">
        <span class="label-text font-semibold">Select End Date</span>
    </label>

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