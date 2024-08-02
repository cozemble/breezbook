<script lang="ts">
    import type {
        AnySuitableResourceSpec,
        EarliestResourceAvailability,
        ResourceSummary,
        Service,
        Tenant
    } from "@breezbook/backend-api-types";
    import {onMount} from "svelte";
    import {backendUrl, fetchJson} from "$lib/helpers";
    import {mandatory} from "@breezbook/packages-core";
    import TopNav from "$lib/uxs/personal-training-2/TopNav.svelte";
    import GymBrand from "$lib/uxs/personal-training-2/GymBrand.svelte";
    import {language, translations} from "$lib/ui/stores";
    import {isoDate, isoDateFns, keyValue, type KeyValue} from "@breezbook/packages-types";
    import ChooseTrainer from "$lib/uxs/personal-training-2/ChooseTrainer.svelte";
    import ChooseTrainerTimeslot from "$lib/uxs/personal-training-2/ChooseTrainerTimeslot.svelte";
    import {
        type CoreCustomerDetails,
        type JourneyState,
        journeyStateFns,
        type Slot
    } from "$lib/uxs/personal-training/journeyState";
    import {initializeJourneyState} from "$lib/uxs/personal-training/journeyState.js";
    import FillForm from "$lib/uxs/personal-training/FillForm.svelte";
    import FillCustomerDetails from "$lib/uxs/personal-training/FillCustomerDetails.svelte";
    import TakePayment from "$lib/uxs/personal-training/TakePayment.svelte";
    import {type Writable, writable} from "svelte/store";
    import BookingSummary from "$lib/uxs/personal-training-2/BookingSummary.svelte";

    export let languageId: string
    let tenant: Tenant
    let personalTrainers: ResourceSummary[] = []
    let selectedPersonalTrainer: ResourceSummary | null = null
    let earliestAvailability: EarliestResourceAvailability[] = []
    let locationId: Writable<string | null> = writable(null)
    let personalTrainerRequirement: AnySuitableResourceSpec
    let personalTrainingService: Service
    let locations: KeyValue[] = []
    let state: "loading" | "loaded" = "loading"
    let navState: "chooseTrainer" | "chooseTime" | "fillForm" | "fillCustomerDetails" | "takePayment" = "chooseTrainer"

    let journeyState: JourneyState

    onMount(async () => {
        tenant = await fetchJson<Tenant>(backendUrl(`/api/dev/tenants?slug=breezbook-gym&lang=${languageId}`), {method: "GET"})
        const serviceLocation = mandatory(tenant.serviceLocations.find(location => location.locationId.includes("london")), `London location not found`)
        $locationId = serviceLocation.locationId
        locations = tenant.locations.map(location => keyValue(location.id, location.name))
        await fetchPersonalTrainers(serviceLocation.locationId)
        state = "loaded"
    })

    async function fetchPersonalTrainers(locationId: string) {
        personalTrainers = await fetchJson<ResourceSummary[]>(backendUrl(`/api/dev/breezbook-gym/${locationId}/resources/personal.trainer/list?lang=${languageId}`), {method: "GET"})
        personalTrainingService = mandatory(tenant.services.find(s => s.slug === 'pt1hr'), `Service pt1hr not found`)
        personalTrainerRequirement = mandatory(personalTrainingService.resourceRequirements[0], `No resource requirements`) as AnySuitableResourceSpec;
        journeyState = initializeJourneyState(tenant, personalTrainingService.id, locationId, [])
        navState = "chooseTrainer"
        selectedPersonalTrainer = null
        const today = isoDate()
        const someDaysFromNow = isoDateFns.addDays(today, 14)
        const dateRange = `fromDate=${today.value}&toDate=${someDaysFromNow.value}`

        earliestAvailability = await fetchJson<EarliestResourceAvailability[]>(backendUrl(`/api/dev/breezbook-gym/${locationId}/resources/personal.trainer/service/${personalTrainingService.id}/availability?${dateRange}`), {method: "GET"})
    }

    function toggleSelection(t: ResourceSummary) {
        selectedPersonalTrainer = t
        navState = "chooseTime"
        const requirementOverrides = [{
            requirementId: personalTrainerRequirement.id.value,
            resourceId: t.id
        }]

        journeyState = journeyStateFns.setResourceRequirements(journeyState, requirementOverrides)
    }

    async function onLocationChanged(id: string) {
        $locationId = id
        await fetchPersonalTrainers($locationId)
    }

    async function onLanguageChanged(lang: string) {
        $language = lang
    }

    function onSlotSelected(slot: Slot) {
        journeyState = journeyStateFns.slotSelected(journeyState, slot)
        console.log({journeyState})
        navState = "fillForm"
    }

    function onFormFilled(event: CustomEvent) {
        journeyState = journeyStateFns.formFilled(journeyState, event.detail)
        navState = "fillCustomerDetails"
    }

    function onCustomerDetailsFilled(event: CustomEvent<CoreCustomerDetails>) {
        journeyState = journeyStateFns.setCustomerDetails(journeyState, event.detail)
        navState = "takePayment"
    }

    function onPaymentComplete() {
        journeyState = journeyStateFns.setPaid(journeyState)
    }

    function goBack() {
        if (navState === "chooseTime") {
            navState = "chooseTrainer"
        } else if (navState === "fillForm") {
            navState = "chooseTime"
        } else if (navState === "fillCustomerDetails") {
            navState = "fillForm"
        } else if (navState === "takePayment") {
            navState = "fillCustomerDetails"
        }
    }

</script>

<div class="container mx-auto p-2 max-w-md">
    <GymBrand/>
    <div class="bg-base-100 shadow-xl rounded-lg overflow-hidden border border-base-300">
        {#if state === "loaded"}
            <div class="p-4">
                <TopNav {onLanguageChanged} {onLocationChanged} {locations} {language} location={locationId}/>
                <BookingSummary
                        trainerName={selectedPersonalTrainer?.name ?? null}
                        priceWithNoDecimalPlaces={journeyState.selectedSlot?.slot?.priceWithNoDecimalPlaces ?? null}
                        date={journeyState.selectedSlot?.day?.value ?? null}
                        time={journeyState.selectedSlot?.slot?.startTime24hr ?? null}/>

                <div class="space-y-4">
                    {#if navState === "chooseTrainer"}
                        <h2 class="text-xl font-bold">{$translations.chooseTrainer}</h2>
                        <ChooseTrainer trainers={personalTrainers}
                                       selectedTrainer={selectedPersonalTrainer?.id ?? null}
                                       {earliestAvailability}
                                       onTrainerChosen={toggleSelection}/>
                    {/if}

                    {#if navState === "chooseTime" && selectedPersonalTrainer && $locationId}
                        <h2 class="text-xl font-bold">{$translations.chooseTime}</h2>
                        <ChooseTrainerTimeslot {personalTrainerRequirement}
                                               locationId={$locationId}
                                               selectedSlot={journeyState.selectedSlot}
                                               service={personalTrainingService}
                                               trainer={selectedPersonalTrainer}
                                               locale={$language}
                                               on:back={goBack}
                                               {onSlotSelected}/>
                    {/if}


                    {#if journeyState.selectedSlot}
                        {#if navState === "fillForm" }
                            <FillForm form={journeyStateFns.getFirstServiceForm(journeyState)}
                                      data={journeyStateFns.getFirstServiceFormData(journeyState)}
                                      on:formFilled={onFormFilled} on:back={goBack}/>
                        {:else if navState === "fillCustomerDetails"}
                            <FillCustomerDetails on:filled={onCustomerDetailsFilled} on:back={goBack}/>
                        {:else if navState === "takePayment"}
                            <TakePayment state={journeyState} on:paymentComplete={onPaymentComplete} on:back={goBack}/>
                        {/if}
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>