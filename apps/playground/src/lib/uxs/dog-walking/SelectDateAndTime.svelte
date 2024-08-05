<script lang="ts">
    import {createEventDispatcher, onMount} from "svelte";
    import {backendUrl, fetchJson} from "$lib/helpers";
    import { isoDate, isoDateFns, timezones } from '@breezbook/packages-date-time';
    import {
        api,
        type Availability,
        type AvailabilityResponse,
        type Service,
        type ServiceOption
    } from "@breezbook/backend-api-types";
    import HorizontalDateAndTimePicker from "$lib/uxs/dog-walking/HorizontalDateAndTimePicker.svelte";
    import {availabilityResponseToItems, formatPrice} from "$lib/uxs/dog-walking/types";

    export let tenantId: string
    export let service: Service
    export let serviceOptions: ServiceOption[]
    export let locationId: string
    export let selectedSlot: Availability | null = null
    let selectedDate = selectedSlot?.date ?? null
    let selectedTime = selectedSlot?.startTime24hr ?? null
    const today = isoDateFns.today(timezones.utc)
    const dateInTheFuture = isoDateFns.addDays(today, 14)
    let availableSlots: AvailabilityResponse
    const dateRange = isoDateFns.listDays(today, dateInTheFuture)
    let labelsForDay = {} as Record<string, string>


    export let onComplete: (slot: Availability) => void
    const dispatch = createEventDispatcher()

    $: isSelectionComplete = selectedDate !== null && selectedTime !== null;

    onMount(async () => {
        const dateRange = `fromDate=${today.value}&toDate=${dateInTheFuture.value}`
        const serviceOptionRequests = serviceOptions.map(so => ({serviceOptionId: so.id, quantity: 1}))
        const options = api.serviceAvailabilityOptions([], [], serviceOptionRequests)
        availableSlots = await fetchJson(backendUrl(`/api/dev/${tenantId}/${locationId}/service/${service.id}/availability?${dateRange}`), {
            method: "POST",
            body: JSON.stringify(options)
        })
        Object.keys(availableSlots.slots).map(date => {
            const available = availableSlots.slots[date] ?? [] as Availability[]
            const minPriceForDay = Math.min(...available.map(a => a.priceBreakdown.total))
            labelsForDay[date] = `${formatPrice(minPriceForDay, service.priceCurrency)}`
        })
    })

    function oNext() {
        if (selectedDate && selectedTime) {
            const available = availableSlots.slots[selectedDate] ?? [] as Availability[]
            const slot = available.find(a => a.startTime24hr === selectedTime)
            if (slot) {
                onComplete(slot)
            } else {
                console.error(`Slot not found for ${selectedDate} @ ${selectedTime}`)
            }
        }

    }

    function onTimeSelected(event: CustomEvent<{ date: string, time: string }>) {
        const {date, time} = event.detail
        const available = availableSlots.slots[date] ?? [] as Availability[]
        const slot = available.find(a => a.startTime24hr === time)
        if (slot) {
            dispatch('slotSelected', slot)
        }
    }
</script>

{#if availableSlots}
    <HorizontalDateAndTimePicker availability={availabilityResponseToItems(dateRange, availableSlots)}
                                 {labelsForDay}
                                 bind:selectedDate={selectedDate}
                                 bind:selectedTime={selectedTime}
                                 on:timeSelected={onTimeSelected}/>
    <button class="btn btn-primary mt-4" on:click={oNext} disabled={!isSelectionComplete}>
        Next
    </button>
{/if}