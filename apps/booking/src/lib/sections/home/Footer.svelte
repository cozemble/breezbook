<script lang="ts">
	import { page } from '$app/stores';
	import tenantStore from '$lib/stores/tenant';
	import routeStore from '$lib/stores/routes';

	const routes = routeStore.get();
	const tenant = tenantStore.get();
</script>

<footer class="footer px-3 md:px-6 py-4 flex justify-center bg-neutral text-neutral-content">
	<div class="w-full max-w-7xl flex justify-between">
		<p class="text-center">{tenant.name}</p>
		<p class="text-center text-xs opacity-50 inline">
			Provided by
			<a href={routes.breezbook()} class="link-hover"> breezbook </a>
			&copy; {new Date().getFullYear()}
		</p>
	</div>
</footer>
