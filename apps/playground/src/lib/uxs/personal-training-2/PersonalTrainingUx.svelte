<script lang="ts">
    import type {AnySuitableResourceSpec, ResourceSummary, Service, Tenant} from "@breezbook/backend-api-types";
    import {onMount} from "svelte";
    import {backendUrl, fetchJson} from "$lib/helpers";
    import {mandatory} from "@breezbook/packages-core";
    import TopNav from "$lib/uxs/personal-training-2/TopNav.svelte";
    import GymBrand from "$lib/uxs/personal-training-2/GymBrand.svelte";
    import {language, translations} from "$lib/ui/stores";
    import {keyValue, type KeyValue} from "@breezbook/packages-types";
    import ChooseTrainer from "$lib/uxs/personal-training-2/ChooseTrainer.svelte";

    export let languageId: string
    let tenant: Tenant
    let personalTrainers: ResourceSummary[] = []
    let selectedPersonalTrainer: ResourceSummary | null = null
    let locationId: string | null = null
    let personalTrainerRequirement: AnySuitableResourceSpec
    let personalTrainingService: Service
    let locations: KeyValue[] = []
    let state: "loading" | "loaded" = "loading"

    onMount(async () => {
        tenant = await fetchJson<Tenant>(backendUrl(`/api/dev/tenants?slug=breezbook-gym&lang=${languageId}`), {method: "GET"})
        const serviceLocation = mandatory(tenant.serviceLocations.find(location => location.locationId.includes("harlow")), `Harlow location not found`)
        locationId = serviceLocation.locationId
        locations = tenant.locations.map(location => keyValue(location.id, location.name))
        await fetchPersonalTrainers(serviceLocation.locationId)
        state = "loaded"
    })

    async function fetchPersonalTrainers(locationId: string) {
        personalTrainers = await fetchJson<ResourceSummary[]>(backendUrl(`/api/dev/breezbook-gym/${locationId}/resources/personal.trainer/list?lang=${languageId}`), {method: "GET"})
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

    async function onLocationChanged(id: string) {
        locationId = id
        await fetchPersonalTrainers(locationId)
    }

    async function onLanguageChanged(lang: string) {
        $language = lang
    }
</script>

<div class="container mx-auto p-2 max-w-md">
    <GymBrand/>
    <div class="bg-base-100 shadow-xl rounded-lg overflow-hidden border border-base-300">
        {#if state === "loaded"}
            <div class="p-4">
                <TopNav {onLanguageChanged} {onLocationChanged} {locations} {language}/>

                <div class="space-y-4">
                    {#if !selectedPersonalTrainer}
                        <h2 class="text-xl font-bold mb-4 text-base-content">{$translations.chooseTrainer}</h2>
                        <ChooseTrainer trainers={personalTrainers}/>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>