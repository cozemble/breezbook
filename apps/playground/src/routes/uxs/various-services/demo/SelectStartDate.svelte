<script lang="ts">
    import type {DatePickConfig} from "./timeSelection2";
    import type {IsoDate} from "@breezbook/packages-types";
    import DaySelector from "$lib/ui/time-picker/DaySelector.svelte";
    import {daysOfWeek} from "./uIConstants";

    export let currentMonth: Date;
    export let options: DatePickConfig[]
    export let selectedStartDate: IsoDate | null = null;

    $: selectedStartDateAsDate = selectedStartDate ? new Date(selectedStartDate.value) : null;

</script>

<div class="grid grid-cols-7 gap-2 text-center mb-2">
    {#each daysOfWeek as day}
        <div class="text-xs font-semibold opacity-70">{day}</div>
    {/each}
</div>

<div class="grid grid-cols-7 gap-2 text-center mb-2">
    <DaySelector {currentMonth} selectedDate={selectedStartDateAsDate} on:clicked/>
</div>