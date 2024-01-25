<script lang="ts">
	import { page } from '$app/stores';
	import { tenantStore } from '$lib/stores/tenant';

	const tenant = tenantStore.get();

	const breezbookLink = (() => {
		const [http, domain] = $page.url.origin.split('//');

		const domainWithoutSubdomain = domain.split('.').slice(1).join('.');

		return `${http}//${domainWithoutSubdomain}`;
	})();
</script>

<footer class="footer px-3 md:px-6 py-4 flex justify-center bg-neutral text-neutral-content">
	<div class="w-full max-w-7xl flex justify-between">
		<p class="text-center">{tenant.name}</p>
		<p class="text-center text-xs opacity-50 inline">
			Provided by
			<a href={breezbookLink} class="link-hover"> breezbook </a>
			&copy; {new Date().getFullYear()}
		</p>
	</div>
</footer>
