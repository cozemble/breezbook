<script lang="ts">
    import {Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock, Dog, MapPin, User} from 'lucide-svelte';
    import {onMount} from "svelte";
    import {backendUrl, fetchJson} from "$lib/helpers";
    import type {Service, ServiceOption, Tenant} from "@breezbook/backend-api-types";
    import ServiceCard from "$lib/uxs/dog-walking/ServiceCard.svelte";
    import ServiceOptionCard from "$lib/uxs/dog-walking/ServiceOptionCard.svelte";

    let tenant: Tenant | null = null;
    let services: Service[] = []
    let isLoading = true;

    type AddOn = {
        id: string;
        name: string;
        price: number;
        quantity: number;
    };

    type BookingData = {
        service: Service | null;
        serviceOptions: ServiceOption[];
        date: Date | null;
        time: string;
        petName: string;
        address: string;
        duration: number;
        addOns: AddOn[];
    };

    let step: number = 0;
    let bookingData: BookingData = {
        service: null,
        serviceOptions: [],
        date: null,
        time: '',
        petName: '',
        address: '',
        duration: 30,
        addOns: [
            {id: 'extra30', name: 'Extra 30 minutes', price: 10, quantity: 0},
            {id: 'extra60', name: 'Extra 60 minutes', price: 18, quantity: 0},
            {id: 'extraDog', name: 'Extra dog', price: 15, quantity: 0}
        ]
    };

    const timeSlots = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'];


    function calculatePrice(): number {
        return 0
    }

    $: currentPrice = calculatePrice();

    function nextStep() {
        step++;
    }

    function prevStep() {
        step--;
    }

    // Simple Calendar Component
    let currentDate: Date = new Date();

    $: daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    $: firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    function prevMonth() {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    }

    function nextMonth() {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }

    function selectDate(day: number) {
        bookingData.date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    }

    function selectService(service: Service) {
        bookingData.service = service;
        bookingData.duration = service.durationMinutes;
    }

    $: monthYear = currentDate.toLocaleString('default', {month: 'long', year: 'numeric'});

    onMount(async () => {
        try {
            tenant = await fetchJson<Tenant>(backendUrl(`/api/dev/tenants?slug=breezbook-dog-walks`), {method: "GET"});
            services = tenant.services
            console.log({tenant});
        } catch (error) {
            console.error("Error loading tenant data:", error);
        } finally {
            isLoading = false;
        }
    });

    function isSelectedServiceOption(option: ServiceOption): boolean {
        return bookingData.serviceOptions.some(serviceOption => serviceOption.id === option.id)
    }

    function toggleServiceOption(option: ServiceOption) {
        if (isSelectedServiceOption(option)) {
            bookingData.serviceOptions = bookingData.serviceOptions.filter(serviceOption => serviceOption.id !== option.id)
        } else {
            bookingData.serviceOptions = [...bookingData.serviceOptions, option]
        }
    }
</script>

<div class="flex justify-center items-center min-h-screen bg-base-200">
    {#if isLoading}
        <div class="text-center">
            <div class="loading loading-spinner loading-lg text-primary"></div>
            <p class="mt-4 text-lg font-semibold">Loading Breez Walks...</p>
        </div>
    {:else if tenant}
        <div class="w-full max-w-md bg-base-100 shadow-xl rounded-lg p-8">
            {#if step === 0}
                <div class="flex flex-col items-center">
                    <h2 class="text-3xl font-bold mb-6 text-primary">Welcome to Breez Walks</h2>
                    <Dog size={64} class="text-primary mb-6"/>
                    <button class="btn btn-primary btn-lg" on:click={nextStep}>Book a Service</button>
                </div>
            {:else if step === 1}
                <div class="flex flex-col">
                    <h3 class="text-2xl font-semibold mb-6 text-primary">Select Service</h3>
                    <div class="grid grid-cols-1  gap-6">
                        {#each services as service (service.id)}
                            <ServiceCard
                                    service={service}
                                    selected={bookingData?.service?.id === service.id}
                                    onClick={() => selectService(service)}/>
                        {/each}
                    </div>
                    <button class="btn btn-primary mt-6" on:click={nextStep} disabled={bookingData.service === null}>
                        Next
                    </button>
                </div>
            {:else if step === 2 && bookingData.service !== null}
                <div class="flex flex-col">
                    <h3 class="text-2xl font-semibold mb-6 text-primary">Configure Service</h3>
                    <div class="form-control">
                        {#each bookingData.service.serviceOptions as serviceOption}
                            <ServiceOptionCard serviceOption={serviceOption}
                                               selected={isSelectedServiceOption(serviceOption)}
                                               onSelect={() => toggleServiceOption(serviceOption)}/>
                        {/each}
                    </div>
                    <button class="btn btn-primary mt-6" on:click={nextStep}>Next</button>
                    <button class="btn btn-outline mt-2" on:click={prevStep}>Back</button>
                </div>
            {:else if step === 3}
                <div class="flex flex-col">
                    <h3 class="text-2xl font-semibold mb-6 text-primary">Date and Time</h3>
                    <div class="mb-6">
                        <Calendar class="text-primary mb-2"/>
                        <div class="mb-4">
                            <div class="flex justify-between items-center mb-2">
                                <button on:click={prevMonth} class="btn btn-sm btn-ghost">
                                    <ChevronLeft/>
                                </button>
                                <span class="font-semibold">{monthYear}</span>
                                <button on:click={nextMonth} class="btn btn-sm btn-ghost">
                                    <ChevronRight/>
                                </button>
                            </div>
                            <div class="grid grid-cols-7 gap-1 text-center">
                                {#each ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as day}
                                    <div class="text-xs font-semibold">{day}</div>
                                {/each}
                                {#each Array(firstDayOfMonth) as _, i}
                                    <div class="p-2"></div>
                                {/each}
                                {#each Array(daysInMonth) as _, i}
                                    {@const day = i + 1}
                                    {@const isSelected = bookingData.date?.getDate() === day &&
                                    bookingData.date?.getMonth() === currentDate.getMonth() &&
                                    bookingData.date?.getFullYear() === currentDate.getFullYear()}
                                    <button
                                            on:click={() => selectDate(day)}
                                            class="p-2 rounded-full {isSelected ? 'bg-primary text-white' : 'hover:bg-base-200'}">
                                        {day}
                                    </button>
                                {/each}
                            </div>
                        </div>
                    </div>
                    <div class="mb-6">
                        <Clock class="text-primary mb-2"/>
                        <select
                                bind:value={bookingData.time}
                                class="select select-bordered w-full"
                        >
                            <option value="">Select a time</option>
                            {#each timeSlots as slot}
                                <option value={slot}>{slot}</option>
                            {/each}
                        </select>
                    </div>
                    <button class="btn btn-primary mb-2" on:click={nextStep}>Next</button>
                    <button class="btn btn-outline" on:click={prevStep}>Back</button>
                </div>
            {:else if step === 4}
                <div class="flex flex-col">
                    <h3 class="text-2xl font-semibold mb-6 text-primary">Pet Information</h3>
                    <div class="mb-4">
                        <User class="text-primary mb-2"/>
                        <input
                                type="text"
                                placeholder="Pet's name"
                                bind:value={bookingData.petName}
                                class="input input-bordered w-full"
                        />
                    </div>
                    <div class="mb-4">
                        <MapPin class="text-primary mb-2"/>
                        <input
                                type="text"
                                placeholder="Pick-up address"
                                bind:value={bookingData.address}
                                class="input input-bordered w-full"
                        />
                    </div>
                    <button class="btn btn-primary mb-2" on:click={nextStep}>Review</button>
                    <button class="btn btn-outline" on:click={prevStep}>Back</button>
                </div>
            {:else if step === 5}
                <div class="flex flex-col">
                    <h3 class="text-2xl font-semibold mb-6 text-primary">Review Booking</h3>
                    <div class="bg-base-200 p-4 rounded-lg mb-6">
                        <p><strong>Service:</strong> {bookingData.service}</p>
                        <p><strong>Date:</strong> {bookingData.date?.toDateString()}</p>
                        <p><strong>Time:</strong> {bookingData.time}</p>
                        <p><strong>Pet:</strong> {bookingData.petName}</p>
                        <p><strong>Address:</strong> {bookingData.address}</p>
                        {#if bookingData.addOns.some(addon => addon.quantity > 0)}
                            <p><strong>Add-ons:</strong></p>
                            <ul>
                                {#each bookingData.addOns.filter(addon => addon.quantity > 0) as addon}
                                    <li>{addon.name} x{addon.quantity} (+${addon.price * addon.quantity})</li>
                                {/each}
                            </ul>
                        {/if}
                        <p><strong>Total Price:</strong> ${currentPrice}</p>
                    </div>
                    <button class="btn btn-primary mb-2" on:click={() => step = 6}>Confirm Booking</button>
                    <button class="btn btn-outline" on:click={prevStep}>Back</button>
                </div>
            {:else if step === 6}
                <div class="flex flex-col items-center">
                    <CheckCircle size={64} class="text-success mb-6"/>
                    <h3 class="text-2xl font-semibold mb-4 text-primary">Booking Confirmed!</h3>
                    <p class="text-center mb-6">Thank you for booking with Paw Walks. We'll see you
                        and your pet soon!</p>
                    <p class="text-center mb-6">Total Price: ${currentPrice}</p>
                    <button class="btn btn-primary" on:click={() => step = 0}>Book Another Service</button>
                </div>
            {/if}
        </div>
    {:else}
        <div class="text-center text-error">
            <p class="text-lg font-semibold">Error loading tenant data. Please try again later.</p>
        </div>
    {/if}
</div>