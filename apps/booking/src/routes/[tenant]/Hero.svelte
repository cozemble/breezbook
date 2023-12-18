<script lang="ts">
	import Icon from '@iconify/svelte';
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
			<p class="mb-10">
				{tenant.description}
			</p>

			<a class="btn btn-primary" href="#services">
				Discover Our Services

				<Icon icon="mdi:arrow-down" class="w-5 h-5" />
			</a>
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
