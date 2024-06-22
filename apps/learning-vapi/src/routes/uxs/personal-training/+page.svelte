<script lang="ts">
    import {onMount} from 'svelte'
    import {
        type AnySuitableResource,
        type ResourceSummary,
        type Service,
        type ServiceLocation,
        type Tenant
    } from "@breezbook/backend-api-types";
    import {backendUrl, fetchJson} from "$lib/helpers";
    import {mandatory} from "@breezbook/packages-core";
    import BookPersonalTrainer from "$lib/uxs/personal-training/BookPersonalTrainer.svelte";
    import Markdown from "$lib/markdown/Markdown.svelte";

    let tenant: Tenant
    let personalTrainers: ResourceSummary[] = []
    let selectedPersonalTrainer: ResourceSummary | null = null
    let location: ServiceLocation | null = null
    let personalTrainerRequirement: AnySuitableResource
    let personalTrainingService: Service

    onMount(async () => {
        tenant = await fetchJson<Tenant>(backendUrl(`/api/dev/tenants?slug=breezbook-gym`), {method: "GET"})
        location = mandatory(tenant.serviceLocations.find(location => location.locationId.includes("harlow")), `Harlow location not found`)
        personalTrainers = await fetchJson<ResourceSummary[]>(backendUrl(`/api/dev/breezbook-gym/${location.locationId}/resources/personal.trainer/list`), {method: "GET"})
        personalTrainingService = mandatory(tenant.services.find(s => s.slug === 'pt1hr'), `Service pt1hr not found`)
        personalTrainerRequirement = mandatory(personalTrainingService.resourceRequirements[0], `No resource requirements`) as AnySuitableResource;
    })

    function toggleSelection(personalTrainer: ResourceSummary) {
        if (selectedPersonalTrainer && selectedPersonalTrainer.id === personalTrainer.id) {
            selectedPersonalTrainer = null
        } else {
            selectedPersonalTrainer = personalTrainer
        }
    }
</script>
{#if personalTrainers}
    <div>
        <h3>Personal Trainers</h3>
        {#if location}
            <p>Location: <em>{location.locationId}</em></p>
        {/if}
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

{#if selectedPersonalTrainer && location && personalTrainerRequirement && personalTrainingService}
    {#key selectedPersonalTrainer.id}
        <div class="mt-4">
            <BookPersonalTrainer trainer={selectedPersonalTrainer} locationId={location.locationId}
                                 {personalTrainerRequirement} service={personalTrainingService}/>
        </div>
    {/key}
{/if}