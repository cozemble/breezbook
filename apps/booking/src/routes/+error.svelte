<script lang="ts">
	import { onMount } from 'svelte';

	import { page } from '$app/stores';
	import BreezbookLogo from '$lib/components/BreezbookLogo.svelte';
	import * as utils from '$lib/utils';

	onMount(() => {
		console.error('Error loading page', $page.status, $page.error?.message);
		console.log('Error page', $page);
	});
</script>

<svelte:head>
	<title>Error | Breezbook</title>
</svelte:head>

<main class="min-h-screen flex flex-col justify-center items-center bg-base-100">
	<a class="p-10" href={utils.link.removeSubdomain($page.url)}>
		<BreezbookLogo />
	</a>

	<section class="hero flex-grow items-center justify-center text-center">
		<div class="flex flex-col justify-center items-center">
			<h1
				class="text-9xl font-bold mb-7
					bg-gradient-to-tr from-primary via-secondary to-accent
					bg-clip-text text-transparent
					"
			>
				{$page.status}
			</h1>

			<h2 class="text-secondary-content text-6xl font-semibold mb-24">
				{$page?.error?.message || 'Something went wrong'}
			</h2>
		</div>
	</section>
</main>
