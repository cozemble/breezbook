<script lang="ts">

    import {type DateLabels, daysInMonth, type DisabledDays, formatDate, startDay} from "$lib/ui/time-picker/types";
    import DayButton from "$lib/ui/time-picker/DayButton.svelte";

    export let currentMonth: Date
    export let selectedDate: Date | null = null;
    export let disabledDays: DisabledDays = {};
    export let dateLabels: DateLabels = {};
    
    $: totalDays = daysInMonth(currentMonth);
    $: startingDay = startDay(currentMonth);

</script>

{#each Array.from({length: startingDay}, (_, i) => i) as i}
    <div></div>
{/each}
{#each Array.from({length: totalDays}, (_, i) => i) as i}
    <DayButton month={currentMonth}
               {selectedDate}
               dayIndex={i + 1}
               {disabledDays}
               label={dateLabels[formatDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1))] || null}
               on:clicked/>
{/each}
