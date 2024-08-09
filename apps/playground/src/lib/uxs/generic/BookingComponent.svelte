<script lang="ts">
	import type { Service, ServiceLocation, Tenant, Package, PackageLocation } from '@breezbook/backend-api-types';
	import ServiceCard from '$lib/uxs/dog-walking/ServiceCard.svelte';
	import PackageCard from '$lib/uxs/generic/PackageCard.svelte';
	import { mandatory } from '@breezbook/packages-types';
	import BookingJourney from './BookingJourney.svelte';
	import PackageBookingJourney from './PackageBookingJourney.svelte';

	export let tenant: Tenant;
	export let location: string;

	const availableServicesLocations = tenant.serviceLocations.filter(sl => sl.locationId === location);
	const availableServices = tenant.services.filter(service => availableServicesLocations.some(sl => sl.serviceId === service.id));
	const availablePackageLocations = tenant.packageLocations.filter(pl => pl.locationId === location);
	const availablePackages = tenant.packages.filter(pkg => availablePackageLocations.some(pl => pl.packageId === pkg.id));

	let selectedService: Service | null = null;
	let selectedPackage: Package | null = null;
	let showBookingJourney = false;
	let showPackageBookingJourney = false;

	function selectService(service: Service) {
		selectedService = service;
		showBookingJourney = true;
	}

	function selectPackage(pkg: Package) {
		selectedPackage = pkg;
		showPackageBookingJourney = true;
	}

	function getServiceLocation(service: Service): ServiceLocation {
		return mandatory(availableServicesLocations.find(sl => sl.serviceId === service.id), `Service location not found for service ${service.id}`);
	}

	function getPackageLocation(pkg: Package): PackageLocation {
		return mandatory(availablePackageLocations.find(pl => pl.packageId === pkg.id), `Package location not found for package ${pkg.id}`);
	}

	function handleBackToSelection() {
		showBookingJourney = false;
		showPackageBookingJourney = false;
		selectedService = null;
		selectedPackage = null;
	}
</script>

{#if !showBookingJourney && !showPackageBookingJourney}
	<div class="flex flex-col">
		<h3 class="text-2xl font-semibold mb-6 text-primary">Select Service</h3>
		<div class="grid grid-cols-1 gap-6">
			{#each availableServices as service (service.id)}
				{@const serviceLocation = getServiceLocation(service)}
				<ServiceCard
					{service}
					{serviceLocation}
					selected={selectedService?.id === service.id}
					onClick={() => selectService(service)} />
			{/each}
		</div>

		{#if availablePackages.length > 0}
			<h3 class="text-2xl font-semibold my-6 text-primary">Packages</h3>
			<div class="grid grid-cols-1 gap-6">
				{#each availablePackages as pkg (pkg.id)}
					{@const packageLocation = getPackageLocation(pkg)}
					<PackageCard
						packageItem={pkg}
						{packageLocation}
						selected={selectedPackage?.id === pkg.id}
						onClick={() => selectPackage(pkg)} />
				{/each}
			</div>
		{/if}
	</div>
{:else if showBookingJourney && selectedService}
	<BookingJourney
		{tenant}
		service={selectedService}
		serviceLocation={getServiceLocation(selectedService)}
		on:backToServiceSelection={handleBackToSelection}
	/>
{:else if showPackageBookingJourney && selectedPackage}
	<PackageBookingJourney
		{tenant}
		packageItem={selectedPackage}
		location={getPackageLocation(selectedPackage).locationId}
		on:backToPackageSelection={handleBackToSelection}
	/>
{/if}