<script lang="ts">
    import {createEventDispatcher} from 'svelte';
    import type {TimeString} from './types'; // Import TimeString type if it's defined in a separate file
    import {convertTo12Hour} from './types'; // Import your convertTo12Hour function if it's in a separate file

    export let time: TimeString;
    export let selectedTime: TimeString | null;
    export let timeFormat: '12h' | '24h';
    export let timeLabel: string | null;

    const dispatch = createEventDispatcher();

    function handleTimeSelect(time: TimeString) {
        dispatch('clicked', time);
    }
</script>

<button on:click={() => handleTimeSelect(time)}
        class={`btn border border-neutral p-2 ${
        selectedTime === time ? 'btn-primary' : 'btn-ghost hover:btn-active' }`}>
    <div class="flex flex-col items-center justify-center">
        <div>{timeFormat === '12h' ? convertTo12Hour(time) : time}</div>
        {#if timeLabel}
            <div class="text-xs opacity-70 mt-1">{timeLabel}</div>
        {/if}
    </div>
</button>
