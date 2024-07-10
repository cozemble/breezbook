<script lang="ts">
    import {onMount} from "svelte";
    import {backendUrl, fetchJson} from "$lib/helpers";
    import {isoDate, isoDateFns, serviceOptionId, serviceOptionRequest} from "@breezbook/packages-types";
    import type {AvailabilityResponse, Service, ServiceOption} from "@breezbook/backend-api-types";
    import HorizontalDateAndTimePicker from "$lib/uxs/dog-walking/HorizontalDateAndTimePicker.svelte";
    import {availabilityResponseToItems} from "$lib/uxs/dog-walking/types";

    export let tenantId: string
    export let service: Service
    export let serviceOptions: ServiceOption[]
    export let locationId: string
    export let selectedDate: string | null = null
    export let selectedTime: string | null = null
    const today = isoDate()
    const dateInTheFuture = isoDateFns.addDays(today, 14)
    let availableSlots: AvailabilityResponse
    const dateRange = isoDateFns.listDays(today, dateInTheFuture)

    export let onComplete: () => void

    $: isSelectionComplete = selectedDate !== null && selectedTime !== null;

    onMount(async () => {
        const dateRange = `fromDate=${today.value}&toDate=${dateInTheFuture.value}`
        const serviceOptionRequests = serviceOptions.map(so => serviceOptionRequest(serviceOptionId(so.id)))
        availableSlots = await fetchJson(backendUrl(`/api/dev/${tenantId}/${locationId}/service/${service.id}/availability?${dateRange}`), {
            method: "POST",
            body: JSON.stringify({serviceOptionRequests})
        })
    })
</script>

{#if availableSlots}
    <HorizontalDateAndTimePicker availability={availabilityResponseToItems(dateRange, availableSlots)}
                                 bind:selectedDate={selectedDate}
                                 bind:selectedTime={selectedTime}/>
    <button class="btn btn-primary mt-4" on:click={onComplete} disabled={!isSelectionComplete}>
        Next
    </button>
{/if}