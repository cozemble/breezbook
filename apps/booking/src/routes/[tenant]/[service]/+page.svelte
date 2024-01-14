<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { PageData } from './$types';
	import { tenantStore } from '$lib/stores/tenant';

	export let data: PageData;
	const service = data.service;

	const tenant = tenantStore.get();
</script>

<svelte:head>
	<title>{tenant.name} - {service.name}</title>
</svelte:head>

<section class="hero flex justify-between items-center my-10 rounded-lg">
	<div
		class="hero-content w-full px-0 justify-between
		flex-col-reverse gap-10 items-start sm:flex-row sm:items-center"
	>
		<div class="">
			<h1 class="text-3xl capitalize text-primary font-bold">{service.name}</h1>
			<p class="text-base">{service.description}</p>

			<!-- pricing -->
			<div class="mt-4">
				<span class="text-xs font-light opacity-60"> starting at: </span>
				<div class="text-2xl font-bold">
					<span class="text-4xl font-bold">
						£{service.approximatePrice}
						<span class="text-base font-thin opacity-60 whitespace-nowrap"
							>/
							{service.approximateDuration} mins
						</span>
					</span>
				</div>
			</div>
			<a href="./{service.slug}/booking" class="btn btn-primary mt-8"
				>Book Now

				<Icon icon="mdi:arrow-right" class="w-5 h-5" />
			</a>
		</div>

		<img
			src={service.image}
			alt="service banner"
			class="rounded-lg shadow-lg aspect-video
			min-w-0 w-full sm:max-w-sm"
			aria-hidden
		/>
	</div>
</section>

<!-- TODO details of the service -->
