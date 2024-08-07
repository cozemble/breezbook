<script lang="ts">
    import {Calendar, Clock} from 'lucide-svelte';
    import {afterUpdate, createEventDispatcher, onMount} from 'svelte';
    import {fade, fly} from 'svelte/transition';
    import type {AvailabilityItem, LabelAndTime} from "$lib/uxs/dog-walking/types";

    export let availability: AvailabilityItem[] = [];
    export let selectedDate: string | null = null;
    export let selectedTime: string | null = null;
    export let labelsForDay: Record<string, string>
    const dispatch = createEventDispatcher();

    let scrollContainer: HTMLElement;

    $: availabilityMap = new Map(availability.map(item => [item.date, item.times]));
    $: sortedDates = availability.map(item => item.date).sort();

    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        const localeDate = date.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'});
        return localeDate.split(' ')[0].substring(0, 3)
    }

    function selectDate(dateString: string) {
        if (availabilityMap?.get(dateString)?.length ?? 0 > 0) {
            selectedDate = dateString;
            selectedTime = null;
        }
    }

    function isDateAvailable(dateString: string): boolean {
        return (availabilityMap.get(dateString)?.length ?? 0) > 0;
    }


    function selectTime(time: LabelAndTime) {
        selectedTime = time.startTime24hr;
        dispatch('timeSelected', {date: selectedDate, time: selectedTime});
    }

    onMount(() => {
        setTimeout(() => {
            if (scrollContainer) {
                scrollContainer.scrollLeft = 0;
            }
        }, 0);
    });

    afterUpdate(() => console.log({availabilityMap}))
</script>

<div class="bg-base-200 p-4 rounded-lg">
    <div class="flex items-center mb-4">
        <Calendar class="text-primary mr-2" size={20}/>
        <h3 class="text-lg font-semibold">Select a Date</h3>
    </div>
    <div class="overflow-x-auto pb-2" bind:this={scrollContainer}>
        <div class="flex space-x-2">
            {#each sortedDates as dateString (dateString)}
                <button
                        class="flex flex-col items-center p-2 px-4 rounded-lg transition-colors duration-200
                           {selectedDate === dateString
                             ? 'bg-secondary text-secondary-content'
                             : isDateAvailable(dateString)
                               ? 'bg-base-100 hover:bg-base-300'
                               : 'bg-base-300 text-base-content/50 cursor-not-allowed'}"
                        on:click={() => selectDate(dateString)}
                        disabled={!isDateAvailable(dateString)}>
                    <span class="text-sm font-semibold">{new Date(dateString).getDate()}</span>
                    <span class="text-xs">{formatDate(dateString)}</span>
                    {#if labelsForDay[dateString]}
                        <span class="text-xs mt-1 text-primary">{labelsForDay[dateString]}</span>
                    {/if}
                </button>
            {/each}
        </div>
    </div>

    <div class="mt-6 relative" style="min-height: 120px;">
        {#if selectedDate && availabilityMap.get(selectedDate)}
            <div in:fly={{ y: 20, duration: 300, delay: 200 }} out:fly={{ y: 20, duration: 300 }}>
                <div class="flex items-center mb-4" in:fade={{ duration: 300, delay: 200 }}>
                    <Clock class="text-primary mr-2" size={20}/>
                    <h3 class="text-lg font-semibold">Select a Time</h3>
                </div>
                <div class="grid grid-cols-3 gap-2" in:fade={{ duration: 300, delay: 200 }}>
                    {#each availabilityMap.get(selectedDate) || [] as time}
                        {#if time.timeLabel.includes("---")}
                            <button class="btn btn-sm {selectedTime === time.startTime24hr ? 'btn-secondary' : 'btn-outline'}"
                                    on:click={() => selectTime(time)}>
                                <span class="text-xs text-nowrap"><b>{time.startTime24hr}</b></span>
                            </button>
                        {:else}
                            <button class="btn py-1 {selectedTime === time.startTime24hr ? 'btn-secondary' : 'btn-outline'}"
                                    on:click={() => selectTime(time)}>
                                <span class="text-xs text-nowrap"><b>{time.label}</b></span>
                                <span class="text-xs text-nowrap">{time.timeLabel}</span>
                            </button>
                        {/if}
                    {/each}
                </div>
            </div>
        {:else}
            <div class="absolute inset-0 flex items-center justify-center text-base-content/50"
                 in:fade={{ duration: 300 }}>
                {selectedDate ? 'No available times for the selected date' : 'Please select a date to view available times'}
            </div>
        {/if}
    </div>
</div>

<style>
    .overflow-x-auto {
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .overflow-x-auto::-webkit-scrollbar {
        display: none;
    }
</style>