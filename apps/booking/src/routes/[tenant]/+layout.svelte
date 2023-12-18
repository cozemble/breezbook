<script lang="ts">
	import type { PageData } from './$types';
	import Footer from './Footer.svelte';
	import Header from './Header.svelte';

	export let data: PageData;
	const tenant = data.tenant;
</script>

<div
	class="min-h-screen flex flex-col items-center"
	data-theme={tenant.theme?.theme}
	style={tenant.theme?.font.sans && `font-family: ${tenant.theme?.font.sans};`}
>
	<Header {tenant} />
	<main class="p-3 md:p-6 flex-grow w-full flex flex-col items-center">
		<div class="max-w-7xl w-full">
			<slot />
		</div>
	</main>
	<Footer {tenant} />
</div>
