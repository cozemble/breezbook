<script lang="ts">
	import type { PageData } from './$types';
	import Footer from './Footer.svelte';
	import Header from './Header.svelte';

	export let data: PageData;
	const tenant = data.tenant;
</script>

<div class="min-h-screen flex flex-col items-center">
	<Header {tenant} />
	<main class="p-6 flex-grow w-full flex flex-col items-center">
		<div class="max-w-7xl w-full">
			<slot />
		</div>
	</main>
	<Footer {tenant} />
</div>
