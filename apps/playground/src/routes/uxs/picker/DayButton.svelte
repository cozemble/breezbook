<script lang="ts">
    import {createEventDispatcher} from "svelte";
    import {type DisabledDays, formatDate} from "./types";

    export let month: Date;
    export let dayIndex: number;
    export let selectedDate: Date | null
    export let label: string | null = null;
    export let disabledDays: DisabledDays = {};

    const date = new Date(month.getFullYear(), month.getMonth(), dayIndex);
    const dateString = formatDate(date);
    const isToday = date.toDateString() === new Date().toDateString();
    $: isDisabled = disabledDays[dateString] || false;
    const dispatch = createEventDispatcher();

    function getClassName(isDisabled: boolean, selectedDate: Date | null): string {
        const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
        const commonStyles = 'btn w-full h-full border';
        if (isDisabled) return commonStyles + ' btn-disabled  border-neutral';
        if (isSelected) return commonStyles + ' btn-primary  border-neutral';
        if (isToday) return commonStyles + ' border-accent border-2 todayHighlight';
        return commonStyles + ' btn-ghost hover:btn-active  border-neutral';
    }

    function onClick() {
        if (isDisabled) {
            return
        }
        const clickedDate = new Date(month.getFullYear(), month.getMonth(), dayIndex);
        dispatch('clicked', clickedDate);
    }
</script>

<button on:click={onClick} class={getClassName(isDisabled,selectedDate)} class:isToday>
    <div class="flex flex-col items-center justify-center">
        <div>
            {#if isToday}
                <span class="text-accent">{dayIndex}</span>
            {:else}
                {dayIndex}
            {/if}
        </div>
        {#if label && !isDisabled}
            <div class="text-xs opacity-70 mt-1">{label}</div>
        {/if}
    </div>
</button>

<style>
    .todayHighlight {
        border-top: 0;
        border-left: 0;
        border-right: 0;
    }
</style>