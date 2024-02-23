<script lang="ts">
	import type { PageData } from './$types';
	import { formatPrice } from '$lib/common/utils';

	import tenantStore from '$lib/stores/tenant';
	import bookingStore from '$lib/stores/booking';

	import PickTimeStep from '$lib/sections/booking/PickTimeStep.svelte';
	import ExtrasStep from '$lib/sections/booking/ExtrasStep.svelte';
	import DetailsStep from '$lib/sections/booking/DetailsStep.svelte';

	export let data: PageData;
	const service = data.service;

	const tenant = tenantStore.get();

	const { total } = bookingStore.init(service);
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
			£{formatPrice($total)}
		</span>
	</div>
</section>

<!-- Steps as accordion -->
<section>
	<PickTimeStep />
	<ExtrasStep />
	<DetailsStep />
</section>
