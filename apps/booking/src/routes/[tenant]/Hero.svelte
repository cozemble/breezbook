<script lang="ts">
	export let tenant: Tenant;
</script>

<div class="hero">
	<div
		class="hero-content w-full px-0 justify-between
		flex-col-reverse gap-10 items-start sm:flex-row sm:items-center
		"
	>
		<div class="max-w-xl">
			<h1 class="mb-5 text-5xl font-bold text-primary">
				{tenant.heading}
			</h1>
			<p class="">
				{tenant.description}
			</p>
		</div>

		<img
			src={tenant.heroImage}
			class="
			rounded-lg shadow-lg aspect-video
			min-w-0 w-full sm:max-w-sm
			"
			aria-hidden
			alt="Hero Image"
		/>
	</div>
</div>
