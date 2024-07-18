<script lang="ts">
    import {Calendar, Clock} from 'lucide-svelte';
    import {allServices, type TimeSelection} from "./types";
    import {mandatory} from "@breezbook/packages-types";

    let selectedService = allServices[0];
    let selectedSlot: TimeSelection = {
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: ''
    }

    function handleServiceChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        selectedService = mandatory(allServices.find(service => service.id.value === target.value), `Service with id ${target.value} not found`);
        selectedSlot = {
            startDate: '',
            startTime: '',
            endDate: '',
            endTime: ''
        }
    }
</script>

<div class="container mx-auto p-4 max-w-md">
    <h1 class="text-3xl font-bold text-center mb-8">Service Scheduler</h1>
    <div class="form-control w-full mb-4">
        <label class="label" for="service-select">
            <span class="label-text">Select a service</span>
        </label>
        <select
                id="service-select"
                bind:value={selectedService}
                on:change={handleServiceChange}
                class="select select-bordered w-full"
        >
            {#each allServices as service}
                <option value={service}>{service.name}</option>
            {/each}
        </select>
    </div>
    <div class="flex justify-center mt-4 space-x-2">
        <Calendar class="w-6 h-6"/>
        <Clock class="w-6 h-6"/>
    </div>
</div>