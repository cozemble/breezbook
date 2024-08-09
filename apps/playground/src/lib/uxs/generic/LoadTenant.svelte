<script lang="ts">
	import type { Tenant } from '@breezbook/backend-api-types';
	import { onMount } from 'svelte';
	import { backendUrl, fetchJson } from '$lib/helpers';
	import { keyValue, type KeyValue } from '@breezbook/packages-types';
	import TopNav from '$lib/uxs/personal-training-2/TopNav.svelte';
	import { writable, type Writable } from 'svelte/store';
	import BookingComponent from '$lib/uxs/generic/BookingComponent.svelte';

	export let tenantSlug: string;
	export let heading: string | null = null;
	export let languages: KeyValue[] = [keyValue('en', 'English')];

	let tenant: Tenant | null = null;
	let isLoading = true;

	let locations: KeyValue[] = [];
	const language: Writable<string | null> = writable('en');
	const location: Writable<string | null> = writable(null);


	onMount(async () => {
		try {
			tenant = await fetchJson<Tenant>(backendUrl(`/api/dev/tenants?slug=${tenantSlug}`), { method: 'GET' });
			console.log({ tenant });
			locations = tenant.locations.map(location => keyValue(location.id, location.name));
			$location = locations[0]?.key ?? null;
		} catch (error) {
			console.error('Error loading tenant data:', error);
		} finally {
			isLoading = false;
		}
	});


	// TopNav related functions
	function onLanguageChanged(lang: string) {
		$language = lang;
	}

	function onLocationChanged(id: string) {
		$location = id;
	}


</script>

<div class="flex justify-center items-center min-h-screen bg-base-200">
	{#if isLoading}
		<div class="text-center">
			<div class="loading loading-spinner loading-lg text-primary"></div>
			<p class="mt-4 text-lg font-semibold">Loading ...</p>
		</div>
	{:else if tenant}
		<div class="w-full max-w-md bg-base-100 shadow-xl rounded-lg p-8">
			<TopNav
				{onLanguageChanged}
				{onLocationChanged}
				{languages}
				{locations}
				{language}
				{heading}
				{location} />
			{#if $location}
				{#key $location}
					<BookingComponent {tenant} location={$location} />
				{/key}
			{/if}

		</div>
	{:else}
		<div class="text-center text-error">
			<p class="text-lg font-semibold">Error loading tenant data. Please try again later.</p>
		</div>
	{/if}
</div>