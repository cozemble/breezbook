<script lang="ts">
	export let service: Service;
	export let tenant: Tenant;
</script>

<!-- TODO finish the design -->
<li class="card bg-base-200 rounded-box shadow-lg w-full">
	<figure>
		<img src={service.image} alt={service.name} class="w-full aspect-[5/2] object-cover" />
	</figure>

	<div class="card-body">
		<h2 class="text-2xl font-bold">{service.name}</h2>
		<p>{service.description}</p>

		<!-- TODO format properly -->
		<span class="text-4xl font-bold mt-4">
			<span class="opacity-30 text-2xl"> ≈ </span>

			£{service.approximatePrice}
			<span class="text-base font-thin opacity-60 whitespace-nowrap"
				>/ {service.approximateDuration} mins</span
			>
		</span>
		<span class="text-xs opacity-50">extras may affect the price</span>

		<a href="/{tenant.slug}/{service.slug}" class="btn btn-primary mt-4">Details</a>
	</div>
</li>
