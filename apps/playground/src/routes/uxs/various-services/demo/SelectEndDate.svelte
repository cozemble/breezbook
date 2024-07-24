<script lang="ts">
    import type {DatePickConfig} from "./timeSelectionUiTypes";
    import type {IsoDate} from "@breezbook/packages-types";
    import DaySelector from "$lib/ui/time-picker/DaySelector.svelte";
    import {daysOfWeek} from "./uIConstants";
    import type {DisabledDays} from "$lib/ui/time-picker/types";

    export let currentMonth: Date;
    export let options: DatePickConfig[]
    export let selectedEndDate: IsoDate | null = null;

    $: selectedEndDateAsDate = selectedEndDate ? new Date(selectedEndDate.value) : null;
    $: disabledDays = options.reduce((acc, {date, disabled}) => {
        acc[date.value] = !!disabled;
        return acc;
    }, {} as DisabledDays);


</script>

<div class="grid grid-cols-7 gap-2 text-center mb-2">
    {#each daysOfWeek as day}
        <div class="text-xs font-semibold opacity-70">{day}</div>
    {/each}
</div>

<div class="grid grid-cols-7 gap-2 text-center mb-2">
    <DaySelector {currentMonth} selectedDate={selectedEndDateAsDate} {disabledDays} on:clicked/>
</div>