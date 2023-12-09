<script lang="ts">
	export let service: Service;
	export let tenant: Tenant;
</script>

<!-- TODO finish the design -->
<li class="card bg-base-200 rounded-box shadow-lg w-80">
	<figure>
		<img src={service.image} alt={service.name} class="w-full aspect-video object-cover" />
	</figure>

	<div class="card-body">
		<h2 class="text-2xl font-bold">{service.name}</h2>
		<p>{service.description}</p>

		<div class="stats">
			<div class="stat">
				<div class="stat-title">{service.approximateDuration} m</div>
				<!-- TODO format properly -->
				<div class="stat-value">{service.approximatePrice} £</div>
				<div class="stat-desc">(approximately)</div>
			</div>
		</div>

		<a href="/{tenant.slug}/{service.slug}" class="btn btn-primary">Book now</a>
	</div>
</li>
