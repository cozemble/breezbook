<script lang="ts">
	export let tenant: Tenant;
</script>

<div class="hero">
	<div class="hero-content text-start px-0 justify-between gap-24 w-full">
		<div class="max-w-xl">
			<h1 class="mb-5 text-5xl font-bold text-primary">
				{tenant.heading}
			</h1>
			<p class="mb-5">
				{tenant.description}
			</p>
		</div>

		<img src="https://picsum.photos/800/450" class="max-w-sm rounded-lg shadow-2xl" />
	</div>
</div>
