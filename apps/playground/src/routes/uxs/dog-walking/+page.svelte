<script lang="ts">
    import {Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock, Dog, MapPin, User, Plus} from 'lucide-svelte';

    type AddOn = {
        id: string;
        name: string;
        price: number;
        quantity: number;
    };

    type BookingData = {
        service: string;
        date: Date | null;
        time: string;
        petName: string;
        address: string;
        duration: number;
        addOns: AddOn[];
    };

    let step: number = 0;
    let bookingData: BookingData = {
        service: '',
        date: null,
        time: '',
        petName: '',
        address: '',
        duration: 30,
        addOns: [
            { id: 'extra30', name: 'Extra 30 minutes', price: 10, quantity: 0 },
            { id: 'extra60', name: 'Extra 60 minutes', price: 18, quantity: 0 },
            { id: 'extraDog', name: 'Extra dog', price: 15, quantity: 0 }
        ]
    };

    const timeSlots = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'];
    const serviceOptions = [
        { name: 'Individual Walk', type: 'individual' },
        { name: 'Group Walk', type: 'group' },
        { name: 'Drop-in Visit', type: 'fixed' },
        { name: 'Pet Sitting Visit', type: 'fixed' }
    ];

    // Simple pricing model
    const basePrices = {
        'Individual Walk': 20,
        'Group Walk': 15,
        'Drop-in Visit': 15,
        'Pet Sitting Visit': 40
    };

    function calculatePrice(): number {
        if (!bookingData.service) return 0;

        let price = basePrices[bookingData.service];

        if (serviceOptions.find(s => s.name === bookingData.service)?.type === 'individual') {
            price = (price / 30) * bookingData.duration; // Adjust price for duration
        }

        // Add prices for add-ons
        bookingData.addOns.forEach(addon => {
            price += addon.price * addon.quantity;
        });

        return Math.round(price * 100) / 100; // Round to 2 decimal places
    }

    $: currentPrice = calculatePrice();

    function nextStep() {
        step++;
    }

    function prevStep() {
        step--;
    }

    function updateAddonQuantity(addon: AddOn, change: number) {
        addon.quantity = Math.max(0, addon.quantity + change);
        bookingData = {...bookingData}; // Trigger reactivity
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

    $: monthYear = currentDate.toLocaleString('default', {month: 'long', year: 'numeric'});
    $: serviceType = serviceOptions.find(s => s.name === bookingData.service)?.type;
</script>

<div class="flex justify-center items-center min-h-screen bg-base-200">
    <div class="w-full max-w-md bg-base-100 shadow-xl rounded-lg p-8">
        {#if step === 0}
            <div class="flex flex-col items-center">
                <h2 class="text-3xl font-bold mb-6 text-primary">Welcome to Paw Walks</h2>
                <Dog size={64} class="text-primary mb-6"/>
                <button class="btn btn-primary btn-lg" on:click={nextStep}>Book a Service</button>
            </div>
        {:else if step === 1}
            <div class="flex flex-col">
                <h3 class="text-2xl font-semibold mb-6 text-primary">Select Service</h3>
                <div class="form-control">
                    {#each serviceOptions as service}
                        <label class="label cursor-pointer justify-start">
                            <input
                                    type="radio"
                                    name="service"
                                    class="radio radio-primary mr-4"
                                    value={service.name}
                                    bind:group={bookingData.service}
                            />
                            <span class="label-text text-lg">{service.name}</span>
                        </label>
                    {/each}
                </div>
                {#if serviceType === 'individual'}
                    <div class="mt-4">
                        <label class="label">
                            <span class="label-text">Duration (minutes)</span>
                        </label>
                        <input
                                type="number"
                                min="30"
                                step="15"
                                bind:value={bookingData.duration}
                                class="input input-bordered w-full"
                        />
                    </div>
                {/if}
                <p class="mt-4">Base Price: ${currentPrice}</p>
                <button class="btn btn-primary mt-6" on:click={nextStep}>Next</button>
            </div>
        {:else if step === 2}
            <div class="flex flex-col">
                <h3 class="text-2xl font-semibold mb-6 text-primary">Add-ons and Extras</h3>
                <div class="form-control">
                    {#each bookingData.addOns as addon}
                        <div class="flex items-center justify-between mb-4">
                            <span class="label-text">{addon.name} (+${addon.price})</span>
                            <div class="flex items-center">
                                <button class="btn btn-sm btn-outline" on:click={() => updateAddonQuantity(addon, -1)}>-</button>
                                <span class="mx-2">{addon.quantity}</span>
                                <button class="btn btn-sm btn-outline" on:click={() => updateAddonQuantity(addon, 1)}>+</button>
                            </div>
                        </div>
                    {/each}
                </div>
                <p class="mt-4">Updated Price: ${currentPrice}</p>
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
                                        class="p-2 rounded-full {isSelected ? 'bg-primary text-white' : 'hover:bg-base-200'}"
                                >
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
                    {#if serviceType === 'individual'}
                        <p><strong>Duration:</strong> {bookingData.duration} minutes</p>
                    {/if}
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
                    and your pet{bookingData.addOns.find(a => a.id === 'extraDog')?.quantity > 0 ? 's' : ''} soon!</p>
                <p class="text-center mb-6">Total Price: ${currentPrice}</p>
                <button class="btn btn-primary" on:click={() => step = 0}>Book Another Service</button>
            </div>
        {/if}
    </div>
</div>