<script lang="ts">
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

export let mode: '12h' | '24h' = '24h';
export let minuteStep: number = 1;
export let startHour: number = 0;
export let endHour: number = 23;

let hour: number = 0;
let minute: number = 0;

const hours24 = Array.from(Array(endHour - startHour + 1).keys()).map(h => h + startHour);
const minutes = Array.from(Array(60).keys()).filter(m => m % minuteStep === 0);

$: {
    let timeString: string;
    if (mode === '24h') {
        timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    } else {
        const hourValue = hour % 12 || 12;
        const periodValue = hour < 12 ? 'AM' : 'PM';
        timeString = `${hourValue.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${periodValue}`;
    }
    dispatch('timeSelected', timeString);
}
</script>

<div class="flex gap-4">
    <select class="select select-bordered" bind:value={hour}>
        {#if mode === '24h'}
            {#each hours24 as h}
                <option value={h}>{h.toString().padStart(2, '0')}</option>
            {/each}
        {:else}
            {#each hours24 as h}
                <option value={h}>{`${(h % 12 || 12).toString().padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`}</option>
            {/each}
        {/if}
    </select>
    <select class="select select-bordered" bind:value={minute}>
        {#each minutes as m}
            <option value={m}>{m.toString().padStart(2, '0')}</option>
        {/each}
    </select>
</div>

<style>
    /* Using daisyUI styles */
</style>