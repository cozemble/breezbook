<script lang="ts">
	import { formatPrice } from '$lib/common/utils';

	export let service: Service;
	export let tenant: Tenant;
</script>

<!-- TODO finish the design -->
<li class="card bg-base-200 rounded-lg shadow-lg w-full">
	<figure>
		<img src={service.image} alt={service.name} class="w-full aspect-[3/1] object-cover" />
	</figure>

	<div class="card-body">
		<h2 class="text-2xl font-bold capitalize leading-6">{service.name}</h2>
		<p class="mb-4">{service.description}</p>

		<span class="text-xs font-light opacity-60"> starting at: </span>
		<span class="text-4xl font-bold">
			£{formatPrice(service.approximatePrice)}
			<span class="text-base font-thin opacity-60 whitespace-nowrap text-base-content"
				>/ {service.approximateDuration} mins</span
			>
		</span>

		<a href="/{service.slug}" class="btn btn-primary mt-4">Details</a>
	</div>
</li>
