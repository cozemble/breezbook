<script lang="ts">
    import type {IsoDate} from "@breezbook/packages-date-time";
    import DaySelector from "$lib/ui/time-picker/DaySelector.svelte";
    import {daysOfWeek} from "./uIConstants";
    import {disabledStartDays} from "./toUiModel";
    import MonthSelector from "./MonthSelector.svelte";
    import type {SchedulingOptions} from "./types2";

    export let currentMonth: Date;
    export let selectedStartDate: IsoDate | null = null;
    export let schedulingOptions: SchedulingOptions

    $: selectedStartDateAsDate = selectedStartDate ? new Date(selectedStartDate.value) : null;
    $: disabledDays = disabledStartDays(currentMonth, schedulingOptions);

</script>

<MonthSelector {currentMonth} on:prevMonth on:nextMonth/>

<div class="grid grid-cols-7 gap-2 text-center mb-2">
    {#each daysOfWeek as day}
        <div class="text-xs font-semibold opacity-70">{day}</div>
    {/each}
</div>

<div class="grid grid-cols-7 gap-2 text-center mb-2">
    <DaySelector {currentMonth} selectedDate={selectedStartDateAsDate} {disabledDays} on:clicked/>
</div>