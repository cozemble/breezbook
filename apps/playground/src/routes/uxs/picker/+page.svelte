<script lang="ts">
    import {onMount} from 'svelte';
    import {ChevronLeft, ChevronRight} from 'lucide-svelte';
    import DayButton from "./DayButton.svelte";
    import {type DateLabels, type DisabledDays, formatDate, type TimeLabels, type TimeString} from "./types";
    import TimeButton from "./TimeButton.svelte";


    let currentMonth: Date = new Date();
    let selectedDate: Date | null = null;
    let selectedTime: TimeString | null = null;
    let timeFormat: '12h' | '24h' = '24h';
    let dateLabels: DateLabels = {};
    let timeLabels: TimeLabels = {};
    let disabledDays: DisabledDays = {};

    $: monthYear = currentMonth.toLocaleString('default', {month: 'long', year: 'numeric'});

    onMount(() => {
        generateDateLabels();
    });

    function setTimeFormat(format: '12h' | '24h'): void {
        timeFormat = format;
    }

    function generateDateLabels(): void {
        const labels: DateLabels = {};
        const timePrices: TimeLabels = {};
        const disabled: DisabledDays = {};
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
                ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
                    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].forEach(time => {
                    // 30% chance of having a specific time price
                    if (Math.random() < 0.3) {
                        const timePrice = Math.floor(Math.random() * (60 - 20 + 1) + 20);
                        timePrices[dateString][time] = `£${timePrice}`;
                    }
                });
            }
        }
        dateLabels = labels;
        timeLabels = timePrices;
        disabledDays = disabled;
    }

    function daysInMonth(date: Date): number {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }

    function startDay(date: Date): number {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    }

    function prevMonth(): void {
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        generateDateLabels();
    }

    function nextMonth(): void {
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        generateDateLabels();
    }

    function handleDateSelect(date: Date | undefined): void {
        if (!date) {
            return;
        }
        const dateString = formatDate(date);
        const isDisabled = disabledDays[dateString] || false;
        if (!isDisabled) {
            selectedDate = date;
            selectedTime = null;
        }
    }

    function handleTimeSelect(event: CustomEvent<TimeString>): void {
        selectedTime = event.detail
    }


    $: times = [
        '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ] as TimeString[];

    $: selectedDateString = selectedDate ? formatDate(selectedDate) : '';
    $: dayTimeLabels = timeLabels[selectedDateString] || {};

    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

    $: totalDays = daysInMonth(currentMonth);
    $: startingDay = startDay(currentMonth);

    function onDateSelected(event: CustomEvent<Date>) {
        handleDateSelect(event.detail);
    }
</script>


<div class="card bg-base-300 shadow-xl w-full max-w-screen-md mx-auto">
    <div class="card-body">
        <div class="flex justify-between items-center mb-4">
            <h2 class="card-title">
                {currentMonth.toLocaleString('default', {month: 'long', year: 'numeric'})}
            </h2>
            <div class="btn-group">
                <button on:click={prevMonth} class="btn btn-sm">
                    <ChevronLeft size={20}/>
                </button>
                <button on:click={nextMonth} class="btn btn-sm">
                    <ChevronRight size={20}/>
                </button>
            </div>
        </div>
        <div class="grid grid-cols-7 gap-2 text-center mb-2">
            {#each daysOfWeek as day}
                <div class="text-xs font-semibold opacity-70">{day}</div>
            {/each}
        </div>

        <div class="grid grid-cols-7 gap-2 mb-4">
            {#each Array.from({length: startingDay}, (_, i) => i) as i}
                <div></div>
            {/each}
            {#each Array.from({length: totalDays}, (_, i) => i) as i}
                <DayButton month={currentMonth}
                           {selectedDate}
                           dayIndex={i + 1}
                           {disabledDays}
                           label={dateLabels[formatDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1))] || null}
                           on:clicked={onDateSelected}/>
            {/each}
        </div>

        {#if selectedDate}
            <div class="mt-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">
                        {selectedDate.toLocaleString('default', {weekday: 'short', day: 'numeric'})}
                    </h3>
                    <div class="btn-group">
                        <button
                                on:click={() => setTimeFormat('12h')}
                                class={`btn btn-sm ${timeFormat === '12h' ? 'btn-primary' : ''}`}>
                            12h
                        </button>
                        <button
                                on:click={() => setTimeFormat('24h')}
                                class={`btn btn-sm ${timeFormat === '24h' ? 'btn-primary' : ''}`}>
                            24h
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {#each times as time}
                        <TimeButton time={time}
                                    {selectedTime}
                                    timeFormat={timeFormat}
                                    timeLabel={dayTimeLabels[time] || null}
                                    on:clicked={handleTimeSelect}
                        />
                    {/each}
                </div>
            </div>
        {/if}

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


