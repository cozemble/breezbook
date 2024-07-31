<script lang="ts">
    import TopNav from "$lib/uxs/personal-training-2/TopNav.svelte";
    import GymBrand from "$lib/uxs/personal-training-2/GymBrand.svelte";
    import TimePicker from "$lib/ui/time-picker/TimePicker.svelte";
    import {
        type DateLabels,
        type DateTimes,
        type DisabledDays,
        formatDate,
        type TimeLabels,
        type TimeString
    } from "$lib/ui/time-picker/types";

    let currentMonth: Date = new Date();
    let selectedDate: Date | null = null;
    let selectedTime: TimeString | null = null;
    let dateLabels: DateLabels = {};
    let dateTimes: DateTimes = {}
    let timeLabels: TimeLabels = {};
    let disabledDays: DisabledDays = {};

    const times = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']


    function generateDateLabels(): void {
        const timePrices: TimeLabels = {};
        const disabled: DisabledDays = {};
        const theDateTimes: DateTimes = {};
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = formatDate(date);

            // Randomly disable some days (20% chance)
            if (Math.random() < 0.2) {
                disabled[dateString] = true;
            } else {
                // Generate time labels for non-disabled days
                timePrices[dateString] = {};

                // Generate random time slots for each day by dropping a few times from the times array
                theDateTimes[dateString] = times.filter(() => Math.random() > 0.4);
            }
        }
        timeLabels = timePrices;
        disabledDays = disabled;
        dateTimes = theDateTimes;
    }


    function onMonthChanged(event: CustomEvent<Date>): void {
        currentMonth = event.detail;
        selectedDate = null;
        selectedTime = null;
        generateDateLabels();
    }

    function onDateSelected(event: CustomEvent<Date>): void {
        selectedDate = event.detail;
    }

    function onTimeSelected(event: CustomEvent<TimeString>): void {
        selectedTime = event.detail;
    }


</script>

<div class="container mx-auto p-2 max-w-md">
    <GymBrand/>
    <div class="bg-base-100 shadow-xl rounded-lg overflow-hidden border border-base-300">
        <div class="p-4">

            <div class="space-y-4">
                <h2 class="text-xl font-bold mb-4 text-base-content">Choose Date and Time</h2>
                <TimePicker {currentMonth}
                            {selectedDate}
                            {selectedTime}
                            {dateLabels}
                            {dateTimes}
                            {timeLabels}
                            {disabledDays}
                            on:dateSelected={onDateSelected}
                            on:timeSelected={onTimeSelected}
                            on:monthChanged={onMonthChanged}/>
            </div>

            <div class="mt-6 flex justify-end">
                <button
                        class="px-6 py-2 bg-primary hover:bg-primary-focus text-primary-content rounded-md transition-colors font-semibold">
                    Next
                </button>
            </div>
        </div>
    </div>
</div>