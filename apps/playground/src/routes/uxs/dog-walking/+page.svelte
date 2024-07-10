<script lang="ts">
    import {CheckCircle, Dog} from 'lucide-svelte';
    import {onMount} from "svelte";
    import {backendUrl, fetchJson} from "$lib/helpers";
    import {
        type FormAndLabels,
        type Service,
        type ServiceLocation,
        type ServiceOption,
        type Tenant,
    } from "@breezbook/backend-api-types";
    import ServiceCard from "$lib/uxs/dog-walking/ServiceCard.svelte";
    import ServiceOptionCard from "$lib/uxs/dog-walking/ServiceOptionCard.svelte";
    import {mandatory} from "@breezbook/packages-types";
    import SelectDateAndTime from "$lib/uxs/dog-walking/SelectDateAndTime.svelte";
    import FillJsonSchemaForm from "$lib/uxs/dog-walking/FillJsonSchemaForm.svelte";
    import type {JSONSchema} from "$lib/uxs/dog-walking/types";
    import BookingSummary from "$lib/uxs/dog-walking/BookingSummary.svelte";
    import type {CoreCustomerDetails} from "$lib/uxs/personal-training/journeyState";
    import FillCustomerDetails from "$lib/uxs/dog-walking/FillCustomerDetails.svelte";
    import {booking} from "@breezbook/packages-core";

    let tenant: Tenant | null = null;
    let services: Service[] = []
    let isLoading = true;


    type BookingData = {
        service: Service | null;
        serviceOptions: ServiceOption[];
        serviceLocation: ServiceLocation | null
        date: string | null;
        time: string;
        serviceFormData: Record<string, any>[];
        petName: string;
        address: string;
        duration: number;
        customer: CoreCustomerDetails|null
    };

    let step = 0;
    let formIndex = 0;
    let bookingData = initialBookingData()

    function initialBookingData(): BookingData {
        return {
            service: null,
            serviceOptions: [],
            serviceLocation: null,
            date: null,
            time: '',
            serviceFormData: [],
            petName: '',
            address: '',
            duration: 0,
            customer: null
        }
    }


    function calculatePrice(bookingData: BookingData): number {
        if (!bookingData.service) return 0;
        let total = bookingData.service.priceWithNoDecimalPlaces;
        bookingData.serviceOptions.forEach(option => {
            total += option.priceWithNoDecimalPlaces;
        });
        return total;
    }

    $: currentPrice = calculatePrice(bookingData);

    function nextStep() {
        step++;
    }

    function prevStep() {
        step--;
    }

    function selectService(service: Service) {
        if (tenant) {
            bookingData = initialBookingData();
            bookingData.service = service;
            bookingData.duration = service.durationMinutes;
            bookingData.serviceLocation = mandatory(tenant.serviceLocations.find(location => location.serviceId === service.id), `Service location not found`);
            updateFormValues()
        }
    }

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
        updateFormValues()
    }

    function updateFormValues() {
        if (tenant) {
            bookingData.serviceFormData = formsToFill(tenant, bookingData).map(form => ensureSchema(castSchema(form.form.schema), {}));
            console.log({bookingData})
        }
    }

    function formsToFill(tenant: Tenant, bookingData: BookingData): FormAndLabels[] {
        const forms = tenant?.forms ?? []
        const serviceFormIds = bookingData?.service?.forms ?? []
        const serviceOptionForms = bookingData.serviceOptions.flatMap(option => option.forms)
        const allIds = [...serviceFormIds, ...serviceOptionForms]
        return allIds.map(id => mandatory(forms.find(f => f.form.id.value === id.value), `Form with id ${id.value} not found`))
    }

    function ensureSchema(schema: JSONSchema, data: { [key: string]: any }): { [key: string]: any } {
        const newData: { [key: string]: any } = {};
        for (const [field, fieldSchema] of Object.entries(schema.properties)) {
            if (data[field] === undefined) {
                if (fieldSchema.type === 'string') {
                    newData[field] = '';
                } else if (fieldSchema.type === 'number') {
                    newData[field] = 0;
                } else if (fieldSchema.type === 'boolean') {
                    newData[field] = false;
                }
            } else {
                newData[field] = data[field];
            }
        }
        return newData;
    }

    function castSchema(schema: any): JSONSchema {
        return schema as JSONSchema;
    }

    function onNextForm() {
        formIndex = formIndex + 1
        if (formIndex > bookingData.serviceFormData.length - 1) {
            formIndex = bookingData.serviceFormData.length - 1
            nextStep()
        }
    }

    function onPrevForm() {
        formIndex = formIndex - 1
        if (formIndex < 0) {
            formIndex = 0
            prevStep()
        }
    }

    function onCustomerDetailsFilled(event:CustomEvent<CoreCustomerDetails>) {
        bookingData = {...bookingData, customer: event.detail}
        nextStep()
    }

    function onDateTimeComplete() {
        if (bookingData.date && bookingData.time) {
            nextStep();
        }
    }

    $: formToFill = tenant ? formsToFill(tenant, bookingData)[formIndex] : null
</script>

<div class="flex justify-center items-center min-h-screen bg-base-200">
    {#if isLoading}
        <div class="text-center">
            <div class="loading loading-spinner loading-lg text-primary"></div>
            <p class="mt-4 text-lg font-semibold">Loading Breez Walks...</p>
        </div>
    {:else if tenant}
        <div class="w-full max-w-md bg-base-100 shadow-xl rounded-lg p-8">
            {#if step > 1 && step < 7}
                <BookingSummary
                        service={bookingData.service}
                        serviceOptions={bookingData.serviceOptions}
                        date={bookingData.date}
                        time={bookingData.time}
                        totalPrice={currentPrice}
                />
            {/if}

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
                    {#if bookingData.service && bookingData.serviceLocation}
                        <SelectDateAndTime service={bookingData.service}
                                           locationId={bookingData.serviceLocation.locationId}
                                           tenantId={tenant.id}
                                           serviceOptions={bookingData.serviceOptions}
                                           bind:selectedDate={bookingData.date}
                                           bind:selectedTime={bookingData.time}
                                           onComplete={onDateTimeComplete}/>
                        <button class="btn btn-outline mt-4" on:click={prevStep}>Back</button>
                    {/if}
                </div>
            {:else if step === 4 && formToFill}
                <div class="flex flex-col">
                    <h3 class="text-2xl font-semibold mb-6 text-primary">{formToFill.form.name}</h3>
                    <div class="bg-base-200 p-4 rounded-lg mb-6">
                        <FillJsonSchemaForm schema={castSchema(formToFill.form.schema)}
                                            bind:data={bookingData.serviceFormData[formIndex]}
                                            on:next={onNextForm}
                                            on:prev={onPrevForm}
                        />
                    </div>
                </div>
            {:else if step === 5}
                <div class="flex flex-col">
                    <h3 class="text-2xl font-semibold mb-6 text-primary">Your Details</h3>
                    <FillCustomerDetails on:filled={onCustomerDetailsFilled} on:prev={prevStep}/>
                </div>
            {:else if step === 6}
                <div class="flex flex-col">
                    <button class="btn btn-primary mb-2" on:click={nextStep}>Confirm Booking</button>
                    <button class="btn btn-outline" on:click={prevStep}>Back</button>
                </div>
            {:else if step === 7}
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