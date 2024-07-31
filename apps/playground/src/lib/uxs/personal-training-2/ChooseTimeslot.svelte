<script lang="ts">
    import TimePicker from "$lib/ui/time-picker/TimePicker.svelte";
    import {
        type DateLabels,
        type DateTimes,
        type DisabledDays,
        formatDate,
        type TimeLabels,
        type TimeString
    } from "$lib/ui/time-picker/types";
    import {translations} from "$lib/ui/stores";
    import {isoDate, type IsoDate, time24, type TwentyFourHourClockTime} from "@breezbook/packages-types";

    let currentMonth: Date = new Date();
    export let selectedDate: IsoDate | null = null;
    export let selectedTime: TwentyFourHourClockTime | null = null;
    export let dateLabels: DateLabels = {};
    export let dateTimes: DateTimes = {}
    export let timeLabels: TimeLabels = {};
    export let disabledDays: DisabledDays = {};
    export let locale: string = 'default';
    export let onSlotSelected: (date: IsoDate, time: TwentyFourHourClockTime) => void;

    function onMonthChanged(event: CustomEvent<Date>): void {
        currentMonth = event.detail;
        selectedDate = null;
        selectedTime = null;
    }

    function onDateSelected(event: CustomEvent<Date>): void {
        selectedDate = isoDate(formatDate(event.detail));
    }

    function onTimeSelected(event: CustomEvent<TimeString>): void {
        selectedTime = time24(event.detail);
    }

    function onNext() {
        if (selectedDate && selectedTime) {
            onSlotSelected(selectedDate, selectedTime);
        }
    }
</script>

<TimePicker {currentMonth}
            selectedDate={selectedDate ? new Date(selectedDate.value) : null}
            selectedTime={selectedTime ? selectedTime.value : null}
            {dateLabels}
            {dateTimes}
            {timeLabels}
            {disabledDays}
            {locale}
            daysOfWeek={$translations.daysOfTheWeekShort}
            on:dateSelected={onDateSelected}
            on:timeSelected={onTimeSelected}
            on:monthChanged={onMonthChanged}/>

<div class="mt-6 flex justify-end">
    <button on:click={onNext} class:bg-primary={selectedTime}
            disabled={!selectedTime}
            class="px-6 py-2 hover:bg-primary-focus text-primary-content rounded-md transition-colors font-semibold">
        {$translations.next}
    </button>
</div>
