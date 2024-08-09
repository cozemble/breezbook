<script lang="ts">
	import type { Package, Tenant } from '@breezbook/backend-api-types';
	import { createEventDispatcher } from 'svelte';

	export let tenant: Tenant;
	export let packageItem: Package;
	export let location: string;

	const dispatch = createEventDispatcher();

	let step = 1;

	function nextStep() {
		step++;
	}

	function prevStep() {
		if (step === 1) {
			dispatch('backToPackageSelection');
			return;
		}
		step--;
	}

	// Add more functions and logic for package booking journey
</script>

<div class="flex flex-col">
	<h3 class="text-2xl font-semibold mb-6 text-primary">Book Package: {packageItem.name}</h3>

	{#if step === 1}
		<!-- Add package booking steps here -->
		<p>Step 1: Configure package options</p>
		<button class="btn btn-primary mt-6" on:click={nextStep}>Next</button>
		<button class="btn btn-outline mt-2" on:click={prevStep}>Back</button>
	{:else if step === 2}
		<!-- Add more steps as needed -->
		<p>Step 2: Select dates for sessions</p>
		<button class="btn btn-primary mt-6" on:click={nextStep}>Next</button>
		<button class="btn btn-outline mt-2" on:click={prevStep}>Back</button>
	{/if}
</div>