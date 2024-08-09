<script lang="ts">
	import type { Service, ServiceLocation, Tenant } from '@breezbook/backend-api-types';
	import { type Availability, type FormAndLabels, type ServiceOption } from '@breezbook/backend-api-types';
	import { CheckCircle } from 'lucide-svelte';
	import ServiceOptionCard from '$lib/uxs/dog-walking/ServiceOptionCard.svelte';
	import { mandatory } from '@breezbook/packages-types';
	import SelectDateAndTime from '$lib/uxs/dog-walking/SelectDateAndTime.svelte';
	import FillJsonSchemaForm from '$lib/uxs/dog-walking/FillJsonSchemaForm.svelte';
	import type { JSONSchema } from '$lib/uxs/dog-walking/types';
	import { formatPrice } from '$lib/uxs/dog-walking/types';
	import FillCustomerDetails from '$lib/uxs/dog-walking/FillCustomerDetails.svelte';
	import TakePayment from '$lib/uxs/dog-walking/TakePayment.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { CoreCustomerDetails } from '$lib/uxs/personal-training/journeyState';
	import BookingSummary from '$lib/uxs/dog-walking/BookingSummary.svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	export let tenant: Tenant;
	export let service: Service;
	export let serviceLocation: ServiceLocation;

	const dispatch = createEventDispatcher();

	type BookingData = {
		_type: 'service.booking';
		service: Service;
		serviceOptions: ServiceOption[];
		serviceLocation: ServiceLocation;
		selectedSlot: Availability | null;
		serviceFormData: Record<string, any>[];
		customer: CoreCustomerDetails | null;
	};

	let step = 1;
	let formIndex = 0;
	let bookingData: BookingData = {
		_type: 'service.booking',
		service,
		serviceOptions: [],
		serviceLocation,
		serviceFormData: [],
		customer: null,
		selectedSlot: null
	};

	onMount(() => {
		updateFormValues();
		if (step === 1 && (!bookingData.service.serviceOptions || bookingData.service.serviceOptions.length === 0)) {
			step++;
		}
	});

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function nextStep() {
		step++;
		if (step === 1 && (!bookingData.service.serviceOptions || bookingData.service.serviceOptions.length === 0)) {
			step++;
		}
		if (step === 3 && formsToFill(tenant, bookingData).length === 0) {
			step++;
		}
		scrollToTop();
	}

	function bookAnotherService() {
		const currentPath = $page.url.pathname;
		const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
		goto(parentPath);
	}

	function prevStep() {
		if (step === 1) {
			dispatch('backToServiceSelection');
			return;
		}
		step--;
		if (step === 1 && (!bookingData.service.serviceOptions || bookingData.service.serviceOptions.length === 0)) {
			step--;
		}
		if (step === 3 && formsToFill(tenant, bookingData).length === 0) {
			step--;
		}
		scrollToTop();
	}


	function isSelectedServiceOption(option: ServiceOption): boolean {
		return bookingData.serviceOptions.some(serviceOption => serviceOption.id === option.id);
	}

	function toggleServiceOption(option: ServiceOption) {
		if (isSelectedServiceOption(option)) {
			bookingData.serviceOptions = bookingData.serviceOptions.filter(serviceOption => serviceOption.id !== option.id);
		} else {
			bookingData.serviceOptions = [...bookingData.serviceOptions, option];
		}
		updateFormValues();
	}

	function updateFormValues() {
		if (tenant) {
			bookingData.serviceFormData = formsToFill(tenant, bookingData).map(form => ensureSchema(castSchema(form.form.schema), {}));
		}
	}

	function formsToFill(tenant: Tenant, bookingData: BookingData): FormAndLabels[] {
		const forms = tenant?.forms ?? [];
		const serviceFormIds = bookingData?.service?.forms ?? [];
		const serviceOptionForms = bookingData.serviceOptions.flatMap(option => option.forms);
		const allIds = [...serviceFormIds, ...serviceOptionForms];
		return allIds.map(id => mandatory(forms.find(f => f.form.id.value === id.value), `Form with id ${id.value} not found`));
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
		formIndex = formIndex + 1;
		if (formIndex > bookingData.serviceFormData.length - 1) {
			formIndex = bookingData.serviceFormData.length - 1;
			nextStep();
		} else {
			scrollToTop();
		}
	}

	function onPrevForm() {
		formIndex = formIndex - 1;
		if (formIndex < 0) {
			formIndex = 0;
			prevStep();
		} else {
			scrollToTop();
		}
	}

	function onCustomerDetailsFilled(event: CustomEvent<CoreCustomerDetails>) {
		bookingData = { ...bookingData, customer: event.detail };
		nextStep();
	}

	function onSlotSelected(event: CustomEvent<Availability>) {
		const selectedSlot = event.detail;
		bookingData = { ...bookingData, selectedSlot };
	}

	$: formToFill = tenant ? formsToFill(tenant, bookingData)[formIndex] : null;

</script>

<BookingSummary
	service={bookingData.service}
	serviceOptions={bookingData.serviceOptions}
	slot={bookingData.selectedSlot} />

{#if step === 1 && bookingData.service.serviceOptions.length > 0}
	<div class="flex flex-col">
		<h3 class="text-2xl font-semibold mb-6 text-primary">Configure Service</h3>
		<div class="form-control">
			{#each bookingData.service.serviceOptions as serviceOption}
				<ServiceOptionCard serviceOption={serviceOption}
													 selected={isSelectedServiceOption(serviceOption)}
													 onSelect={() => toggleServiceOption(serviceOption)} />
			{/each}
		</div>
		<button class="btn btn-primary mt-6" on:click={nextStep}>Next</button>
		<button class="btn btn-outline mt-2" on:click={prevStep}>Back</button>
	</div>
{:else if step === 2}
	<div class="flex flex-col">
		<h3 class="text-2xl font-semibold mb-6 text-primary">Date and Time</h3>
		<SelectDateAndTime service={bookingData.service}
											 locationId={bookingData.serviceLocation.locationId}
											 tenantId={tenant.id}
											 serviceOptions={bookingData.serviceOptions}
											 selectedSlot={bookingData.selectedSlot}
											 on:slotSelected={onSlotSelected}
											 onComplete={nextStep} />
		<button class="btn btn-outline mt-4" on:click={prevStep}>Back</button>
	</div>
{:else if step === 3 && formToFill}
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
{:else if step === 4}
	<div class="flex flex-col">
		<h3 class="text-2xl font-semibold mb-6 text-primary">Your Details</h3>
		<FillCustomerDetails on:filled={onCustomerDetailsFilled} on:prev={prevStep} />
	</div>
{:else if step === 5}
	<div class="flex flex-col">
		<button class="btn btn-primary mb-2" on:click={nextStep}>Confirm Booking</button>
		<button class="btn btn-outline" on:click={prevStep}>Back</button>
	</div>
{:else if step === 6}
	<div class="flex flex-col items-center">
		<h3 class="text-2xl font-semibold mb-4 text-primary">Take Payment</h3>
		{#if bookingData.customer && bookingData.selectedSlot}
			<TakePayment tenantId={tenant.id}
									 environmentId="dev"
									 serviceId={bookingData.service.id}
									 durationMinutes={bookingData.service.durationMinutes}
									 locationId={bookingData.serviceLocation.locationId}
									 serviceOptions={bookingData.serviceOptions}
									 filledForms={bookingData.serviceFormData}
									 customerDetails={bookingData.customer}
									 date={bookingData.selectedSlot.date}
									 time={bookingData.selectedSlot.startTime24hr}
									 on:prevStep={prevStep}
									 on:paymentComplete={nextStep} />
		{:else}
			<p>Error: Missing booking data</p>
		{/if}
	</div>
{:else if step === 7}
	<div class="flex flex-col items-center">
		<CheckCircle size={64} class="text-success mb-6" />
		<h3 class="text-2xl font-semibold mb-4 text-primary">Booking Confirmed!</h3>
		<p class="text-center mb-6">Thank you for booking with {tenant.name}. We'll see you soon!</p>
		{#if bookingData?.selectedSlot?.priceBreakdown}
			<p class="text-center mb-6">Total
				Price: {formatPrice(bookingData.selectedSlot.priceBreakdown.total, bookingData.selectedSlot.priceBreakdown.currency)}</p>
		{/if}
		<button class="btn btn-primary" on:click={bookAnotherService}>Book Another Service</button>
	</div>
{/if}