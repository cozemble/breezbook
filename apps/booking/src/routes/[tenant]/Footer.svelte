<script lang="ts">
	import { tenantStore } from '$lib/stores/tenant';

	const tenant = tenantStore.get();
</script>

<footer class="footer px-3 md:px-6 py-4 justify-between bg-neutral text-neutral-content">
	<p class="text-center">{tenant.name}</p>
	<p class="text-center text-xs opacity-50 inline">
		Provided by
		<a href="/" class="link-hover"> breezbook </a>
		&copy; {new Date().getFullYear()}
	</p>
</footer>
