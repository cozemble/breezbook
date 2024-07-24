<script lang="ts">
    import {createEventDispatcher} from 'svelte';
    import type {TimeString} from './types';
    import {convertTo12Hour} from './types';

    export let time: TimeString;
    export let selectedTime: TimeString | null;
    export let timeFormat: '12h' | '24h';
    export let timeLabel: string | null = null;

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
