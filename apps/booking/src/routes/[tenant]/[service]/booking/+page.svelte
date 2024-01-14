<script lang="ts">
	import type { PageData } from './$types';
	import Steps from './Steps.svelte';
	import { tenantStore } from '$lib/stores/tenant';

	export let data: PageData;
	const service = data.service;

	const tenant = tenantStore.get();
</script>

<svelte:head>
	<title>{tenant.name} - {service.name} | Booking</title>
</svelte:head>

<!-- Service details -->
<section class="mb-10 pb-2 flex justify-between items-end border-b">
	<div>
		<span class="text-base font-bold"> Booking: </span>
		<h1 class="text-2xl font-semibold">
			<a href="./" class="link-hover link-accent">{service.name}</a>
		</h1>
	</div>

	<!-- Display total -->
	<div class="">
		<span class="text-base font-normal text-secondary mr-4">Total:</span>
		<span class="text-2xl font-bold mt-4">
			£{service.approximatePrice}
		</span>
	</div>
</section>

<!-- Steps as accordion -->
<section>
	<Steps {service} />
</section>
