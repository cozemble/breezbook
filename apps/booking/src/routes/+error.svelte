<script lang="ts">
	import { onMount } from 'svelte';

	import { page } from '$app/stores';
	import BreezbookLogo from '$lib/components/BreezbookLogo.svelte';
	import * as utils from '$lib/common/utils';
	import routeStore from '$lib/stores/routes';

	const routes = routeStore.get();
	onMount(() => {
		console.error('Error loading page', $page.status, $page.error?.message);
		console.log('Error page', $page);
	});

	const goBack = () => {
		history.back();
	};
</script>

<svelte:head>
	<title>Error | Breezbook</title>
</svelte:head>

<div class="p-10">
	<header class="">
		<a href={routes.breezbook()}>
			<BreezbookLogo />
		</a>
	</header>

	<main class="min-h-screen flex flex-col justify-center items-center bg-base-100 pb-[10vh]">
		<section class="hero flex-grow items-center justify-center text-center">
			<div class="flex flex-col justify-center items-center">
				<h1
					class="text-[20vh] font-bold mb-[0.4em] leading-none
					bg-gradient-to-tr from-primary via-secondary to-accent
					bg-clip-text text-transparent
					"
				>
					{$page.status}
				</h1>

				<h2 class="text-secondary-content text-3xl sm:text-5xl font-semibold mb-6">
					{$page?.error?.message || 'Something went wrong'}
				</h2>

				<p class="opacity-60">We're sorry, but something went wrong. Please try again later.</p>

				<button class="btn btn-primary btn-lg mt-16" on:click={goBack}> Go back </button>
			</div>
		</section>
	</main>
</div>
