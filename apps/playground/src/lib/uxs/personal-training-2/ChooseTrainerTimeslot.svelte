<script lang="ts">
    import {
        type AnySuitableResourceSpec,
        api,
        type AvailabilityResponse,
        availabilityResponseFns,
        type ResourceSummary,
        type Service
    } from "@breezbook/backend-api-types";
    import {isoDate, type IsoDate, isoDateFns, type TwentyFourHourClockTime} from "@breezbook/packages-types";
    import {onMount} from "svelte";
    import {backendUrl, fetchJson} from "$lib/helpers";
    import {language, translations} from "$lib/ui/stores";
    import type {DateTimes, DisabledDays} from "$lib/ui/time-picker/types";
    import ChooseTimeslot from "$lib/uxs/personal-training-2/ChooseTimeslot.svelte";

    export let trainer: ResourceSummary
    export let locale: string = 'default';
    export let onSlotSelected: (date: IsoDate, time: TwentyFourHourClockTime) => void;
    export let personalTrainerRequirement: AnySuitableResourceSpec
    export let locationId: string
    export let service: Service

    const today = isoDate()
    const sevenDaysFromNow = isoDateFns.addDays(today, 14)
    const dayList = isoDateFns.listDays(today, sevenDaysFromNow)
    let showNoAvailabilityMessage = false
    let dateTimes: DateTimes = {}
    let disabledDays: DisabledDays = {}

    function availabilityToDateTimes(availability: AvailabilityResponse): DateTimes {
        return dayList.reduce((acc, date) => {
            const slots = availabilityResponseFns.maybeSlotsForDate(availability, date)
            acc[date.value] = slots.map(slot => slot.startTime24hr)
            return acc
        }, {} as DateTimes)
    }

    function calcDisabledDays(dateTimes: DateTimes): DisabledDays {
        return Object.keys(dateTimes).reduce((acc, date) => {
            if (dateTimes[date].length === 0) {
                acc[date] = true
            }
            return acc
        }, {} as DisabledDays)
    }

    onMount(async () => {
        const dateRange = `fromDate=${today.value}&toDate=${sevenDaysFromNow.value}`
        const requirementOverrides = [{
            requirementId: personalTrainerRequirement.id.value,
            resourceId: trainer.id
        }]
        const options = api.serviceAvailabilityOptions([], requirementOverrides, [])

        try {
            const availableSlots = await fetchJson(backendUrl(`/api/dev/breezbook-gym/${locationId}/service/${service.id}/availability?${dateRange}&lang=${$language}`), {
                method: "POST",
                body: JSON.stringify(options)
            }) as AvailabilityResponse
            dateTimes = availabilityToDateTimes(availableSlots)
            disabledDays = calcDisabledDays(dateTimes)
            console.log({availableSlots,dateTimes})
            showNoAvailabilityMessage = false
        } catch (error) {
            console.error({error})
            showNoAvailabilityMessage = true
        }
    })
</script>


{#if showNoAvailabilityMessage}
    <div class="text-red-500">{$translations.noSlotsAvailable}</div>
{:else}
    <ChooseTimeslot {dateTimes} {disabledDays} {locale} {onSlotSelected}/>
{/if}