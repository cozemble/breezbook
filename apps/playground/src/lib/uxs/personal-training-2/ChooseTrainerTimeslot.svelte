<script lang="ts">
    import {
        type AnySuitableResourceSpec,
        api,
        type AvailabilityResponse,
        availabilityResponseFns,
        type ResourceSummary,
        type Service
    } from "@breezbook/backend-api-types";
    import {isoDate, type IsoDate, isoDateFns, time24, type TwentyFourHourClockTime} from "@breezbook/packages-types";
    import {onMount} from "svelte";
    import {backendUrl, fetchJson} from "$lib/helpers";
    import {language, translations} from "$lib/ui/stores";
    import type {DateTimes, DisabledDays} from "$lib/ui/time-picker/types";
    import ChooseTimeslot from "$lib/uxs/personal-training-2/ChooseTimeslot.svelte";
    import type {Slot} from "$lib/uxs/personal-training/journeyState";

    export let trainer: ResourceSummary
    export let locale: string = 'default';
    export let onSlotSelected: (slot: Slot) => void;
    export let personalTrainerRequirement: AnySuitableResourceSpec
    export let locationId: string
    export let service: Service
    export let selectedSlot: Slot | null

    const today = isoDate()
    const sevenDaysFromNow = isoDateFns.addDays(today, 14)
    const dayList = isoDateFns.listDays(today, sevenDaysFromNow)
    let showNoAvailabilityMessage = false
    let dateTimes: DateTimes = {}
    let disabledDays: DisabledDays = {}
    let availableSlots: AvailabilityResponse

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
            availableSlots = await fetchJson(backendUrl(`/api/dev/breezbook-gym/${locationId}/service/${service.id}/availability?${dateRange}&lang=${$language}`), {
                method: "POST",
                body: JSON.stringify(options)
            }) as AvailabilityResponse
            dateTimes = availabilityToDateTimes(availableSlots)
            disabledDays = calcDisabledDays(dateTimes)
            showNoAvailabilityMessage = false
        } catch (error) {
            console.error({error})
            showNoAvailabilityMessage = true
        }
    })

    function onDateTimeSelected(day: IsoDate, time: TwentyFourHourClockTime) {
        const slot = availabilityResponseFns.slotForDateTime(availableSlots, day, time)
        onSlotSelected({day, slot})
    }
</script>


{#if showNoAvailabilityMessage}
    <div class="text-red-500">{$translations.noSlotsAvailable}</div>
{:else}
    <ChooseTimeslot {dateTimes}
                    {disabledDays}
                    {locale}
                    selectedDate={selectedSlot?.day}
                    selectedTime={selectedSlot ? time24(selectedSlot.slot.startTime24hr) : null}
                    onSlotSelected={onDateTimeSelected}
                    on:back/>
{/if}