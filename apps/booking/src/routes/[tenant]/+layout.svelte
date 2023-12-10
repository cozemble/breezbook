<script lang="ts">
	import type { PageData } from './$types';
	import Footer from './Footer.svelte';
	import Header from './Header.svelte';

	export let data: PageData;
	const tenant = data.tenant;
</script>

<div class="min-h-screen flex flex-col">
	<Header {tenant} />
	<main class="p-6 flex-grow">
		<slot />
	</main>
	<Footer {tenant} />
</div>
