<script lang="ts">
    import type {AnySuitableResourceSpec, ResourceSummary, Service, Tenant} from "@breezbook/backend-api-types";
    import {onMount} from "svelte";
    import {backendUrl, fetchJson} from "$lib/helpers";
    import {mandatory} from "@breezbook/packages-core";
    import Markdown from "$lib/markdown/Markdown.svelte";
    import BookPersonalTrainer from "$lib/uxs/personal-training/BookPersonalTrainer.svelte";

    export let languageId: string
    let tenant: Tenant
    let personalTrainers: ResourceSummary[] = []
    let selectedPersonalTrainer: ResourceSummary | null = null
    // let serviceLocation: ServiceLocation | null = null
    let locationId: string | null = null
    let personalTrainerRequirement: AnySuitableResourceSpec
    let personalTrainingService: Service

    onMount(async () => {
        tenant = await fetchJson<Tenant>(backendUrl(`/api/dev/tenants?slug=breezbook-gym&lang=${languageId}`), {method: "GET"})
        const serviceLocation = mandatory(tenant.serviceLocations.find(location => location.locationId.includes("harlow")), `Harlow location not found`)
        locationId = serviceLocation.locationId
        await fetchPersonalTrainers(serviceLocation.locationId)
    })

    async function fetchPersonalTrainers(locationId: string) {
        personalTrainers = await fetchJson<ResourceSummary[]>(backendUrl(`/api/dev/breezbook-gym/${locationId}/resources/personal.trainer/list`), {method: "GET"})
        personalTrainingService = mandatory(tenant.services.find(s => s.slug === 'pt1hr'), `Service pt1hr not found`)
        personalTrainerRequirement = mandatory(personalTrainingService.resourceRequirements[0], `No resource requirements`) as AnySuitableResourceSpec;
    }

    function toggleSelection(personalTrainer: ResourceSummary) {
        if (selectedPersonalTrainer && selectedPersonalTrainer.id === personalTrainer.id) {
            selectedPersonalTrainer = null
        } else {
            selectedPersonalTrainer = personalTrainer
        }
    }

    async function onLocationChanged(event: Event) {
        locationId = (event.target as HTMLSelectElement).value
        await fetchPersonalTrainers(locationId)
    }

</script>

{#if locationId && tenant}
    <div class="flex">
        <label class="label">Location</label>
        <select class="input input-bordered select" on:change={onLocationChanged}>
            {#each tenant.locations as location}
                <option value={location.id} selected={location.id === locationId}>{location.name}</option>
            {/each}
        </select>
    </div>
{/if}
{#if personalTrainers}
    <div>
        <h3>Personal Trainers</h3>
    </div>
{/if}
<div class="flex">
    {#each personalTrainers as personalTrainer}
        <div class="card w-96 bg-base-100 shadow-xl border p-2 ml-2"
             class:border-success={personalTrainer === selectedPersonalTrainer}
             on:click={() => toggleSelection(personalTrainer)}>
            <figure>
                <img src={personalTrainer.branding?.images?.[0]?.publicUrl} alt={personalTrainer.name} width="60px"/>
            </figure>
            <div>
                <Markdown markdown={personalTrainer.branding?.markup?.[0]?.markup}/>
            </div>
        </div>
    {/each}
</div>

{#if selectedPersonalTrainer && locationId && personalTrainerRequirement && personalTrainingService}
    {#key selectedPersonalTrainer.id}
        {#key locationId}
            <div class="mt-4">
                <BookPersonalTrainer trainer={selectedPersonalTrainer} locationId={locationId}
                                     {personalTrainerRequirement} service={personalTrainingService}/>
            </div>
        {/key}
    {/key}
{/if}