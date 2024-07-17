<script>
    import { Calendar, Clock } from 'lucide-svelte';

    // Mock service data (simplified from the TypeScript code)
    const services = [
        {
            id: 'carwash',
            name: 'Mobile car wash',
            schedulingOptions: [
                {
                    _type: 'timeslot-selection',
                    times: [
                        { startTime: '09:00', endTime: '10:00', label: 'Morning slot' },
                        { startTime: '10:00', endTime: '11:00', label: 'Mid-morning slot' },
                        { startTime: '13:00', endTime: '14:00', label: 'Afternoon slot' },
                        { startTime: '14:00', endTime: '15:00', label: 'Mid-afternoon slot' },
                    ],
                },
            ],
        },
        {
            id: 'group-dog-walking',
            name: 'Group dog walking',
            schedulingOptions: [
                {
                    _type: 'timeslot-selection',
                    times: [
                        { startTime: '09:00', endTime: '10:00', label: 'Morning slot' },
                        { startTime: '17:00', endTime: '18:00', label: 'Evening slot' },
                    ],
                },
            ],
        },
        {
            id: 'individual-dog-walking',
            name: 'Individual dog walking',
            schedulingOptions: [
                {
                    _type: 'start-time-selection',
                    startTime: '09:00',
                    endTime: '17:00',
                    period: 60,
                },
            ],
        },
        {
            id: 'pet-boarding',
            name: 'Pet boarding',
            schedulingOptions: [
                {
                    _type: 'fixed-check-in-and-out',
                    checkInTime: '09:00',
                    checkOutTime: '17:00',
                    checkInLabel: 'Drop off',
                    checkOutLabel: 'Pick up',
                },
            ],
        },
        {
            id: 'hotel-room',
            name: 'Hotel room',
            schedulingOptions: [
                { _type: 'multiple-days', minDays: 1, maxDays: 365 },
                {
                    _type: 'fixed-check-in-and-out',
                    checkInTime: '09:00',
                    checkOutTime: '17:00',
                    checkInLabel: 'Check in',
                    checkOutLabel: 'Check out',
                },
            ],
        },
    ];

    let selectedService = services[0];
    let selectedDate = new Date().toISOString().split('T')[0];
    let selectedTime = '';
    let nights = 1;

    function handleServiceChange(event) {
        selectedService = services.find(service => service.id === event.target.value);
        selectedTime = '';
        nights = 1;
    }

    function generateTimeSlots(start, end, period) {
        const slots = [];
        let current = new Date(`2000-01-01T${start}`);
        const endTime = new Date(`2000-01-01T${end}`);

        while (current <= endTime) {
            slots.push(current.toTimeString().slice(0, 5));
            current.setMinutes(current.getMinutes() + period);
        }

        return slots;
    }
</script>

<div class="container mx-auto p-4 max-w-md">
    <h1 class="text-3xl font-bold text-center mb-8">Service Scheduler</h1>
    <div class="form-control w-full mb-4">
        <label class="label" for="service-select">
            <span class="label-text">Select a service</span>
        </label>
        <select
                id="service-select"
                bind:value={selectedService}
                on:change={handleServiceChange}
                class="select select-bordered w-full"
        >
            {#each services as service}
                <option value={service}>{service.name}</option>
            {/each}
        </select>
    </div>
    <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
            <h2 class="card-title">{selectedService.name}</h2>
            {#if selectedService.schedulingOptions[0]._type === 'timeslot-selection'}
                <div class="flex flex-col space-y-4">
                    <input
                            type="date"
                            bind:value={selectedDate}
                            class="input input-bordered w-full"
                    />
                    <select
                            bind:value={selectedTime}
                            class="select select-bordered w-full"
                    >
                        <option value="">Select a time slot</option>
                        {#each selectedService.schedulingOptions[0].times as slot}
                            <option value={slot.startTime}>
                                {slot.label} ({slot.startTime} - {slot.endTime})
                            </option>
                        {/each}
                    </select>
                </div>
            {:else if selectedService.schedulingOptions[0]._type === 'start-time-selection'}
                <div class="flex flex-col space-y-4">
                    <input
                            type="date"
                            bind:value={selectedDate}
                            class="input input-bordered w-full"
                    />
                    <select
                            bind:value={selectedTime}
                            class="select select-bordered w-full"
                    >
                        <option value="">Select a start time</option>
                        {#each generateTimeSlots(selectedService.schedulingOptions[0].startTime, selectedService.schedulingOptions[0].endTime, selectedService.schedulingOptions[0].period) as time}
                            <option value={time}>{time}</option>
                        {/each}
                    </select>
                </div>
            {:else if selectedService.schedulingOptions[0]._type === 'fixed-check-in-and-out'}
                <div class="flex flex-col space-y-4">
                    <input
                            type="date"
                            bind:value={selectedDate}
                            class="input input-bordered w-full"
                    />
                    <div class="flex justify-between">
                        <span class="badge badge-primary">{selectedService.schedulingOptions[0].checkInLabel}: {selectedService.schedulingOptions[0].checkInTime}</span>
                        <span class="badge badge-secondary">{selectedService.schedulingOptions[0].checkOutLabel}: {selectedService.schedulingOptions[0].checkOutTime}</span>
                    </div>
                </div>
            {:else if selectedService.schedulingOptions[0]._type === 'multiple-days'}
                <div class="flex flex-col space-y-4">
                    <input
                            type="date"
                            bind:value={selectedDate}
                            class="input input-bordered w-full"
                    />
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Number of nights</span>
                        </label>
                        <input
                                type="number"
                                min={selectedService.schedulingOptions[0].minDays}
                                max={selectedService.schedulingOptions[0].maxDays}
                                bind:value={nights}
                                class="input input-bordered w-full"
                        />
                    </div>
                </div>
            {:else}
                <p class="text-error">Unsupported scheduling option</p>
            {/if}
        </div>
    </div>
    <div class="flex justify-center mt-4 space-x-2">
        <Calendar class="w-6 h-6" />
        <Clock class="w-6 h-6" />
    </div>
</div>