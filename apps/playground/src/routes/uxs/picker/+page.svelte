<script lang="ts">
    import {onMount} from 'svelte';
    import {
        type DateLabels,
        type DateTimes,
        type DisabledDays,
        formatDate,
        type TimeLabels,
        type TimeString
    } from "$lib/ui/time-picker/types";
    import TimePicker from "$lib/ui/time-picker/TimePicker.svelte";

    let currentMonth: Date = new Date();
    let selectedDate: Date | null = null;
    let selectedTime: TimeString | null = null;
    let dateLabels: DateLabels = {};
    let dateTimes: DateTimes = {}
    let timeLabels: TimeLabels = {};
    let disabledDays: DisabledDays = {};

    onMount(generateDateLabels);

    const times = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

    function generateDateLabels(): void {
        const labels: DateLabels = {};
        const timePrices: TimeLabels = {};
        const disabled: DisabledDays = {};
        const theDateTimes:DateTimes = {};
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = formatDate(date);
            const price = Math.floor(Math.random() * (100 - 30 + 1) + 30);
            labels[dateString] = `£${price}`;

            // Randomly disable some days (20% chance)
            if (Math.random() < 0.2) {
                disabled[dateString] = true;
            } else {
                // Generate time labels for non-disabled days
                timePrices[dateString] = {};
                times.forEach(time => {
                    // 40% chance of having a specific time price
                    if (Math.random() < 0.4) {
                        const timePrice = Math.floor(Math.random() * (60 - 20 + 1) + 20);
                        timePrices[dateString][time] = `£${timePrice}`;
                    }
                });

                // Generate random time slots for each day by dropping a few times from the times array
                theDateTimes[dateString] = times.filter(() => Math.random() > 0.4);
            }
        }
        dateLabels = labels;
        timeLabels = timePrices;
        disabledDays = disabled;
        dateTimes = theDateTimes;
    }

    function onMonthChanged(event: CustomEvent<Date>): void {
        currentMonth = event.detail;
        generateDateLabels();
    }

    function onDateSelected(event: CustomEvent<Date>): void {
        selectedDate = event.detail;
    }

    function onTimeSelected(event: CustomEvent<TimeString>): void {
        selectedTime = event.detail;
    }
</script>


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

<div class="card bg-base-300 shadow-xl w-full max-w-screen-md mx-auto">
    <div class="card-body">
        {#if selectedDate && selectedTime}
            <div class="mt-6 p-4 bg-base-300 rounded-lg">
                <h2 class="text-lg md:text-xl font-semibold mb-2">Selected Date and Time:</h2>
                <p class="text-base md:text-lg">{selectedDate.toDateString()} at {selectedTime}</p>
                <p class="text-base md:text-lg">
                    Price: {timeLabels[formatDate(selectedDate)]?.[selectedTime] || dateLabels[formatDate(selectedDate)]}
                </p>
            </div>
        {/if}
    </div>
</div>


