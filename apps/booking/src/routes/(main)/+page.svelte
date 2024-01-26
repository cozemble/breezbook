<script lang="ts">
	import type { PageData } from './$types';
	import Hero from '$lib/sections/home/Hero.svelte';
	import Services from '$lib/sections/home/Services.svelte';

	export let data: PageData;
	const tenant = data.tenant;
	const services = data.services;
</script>

<svelte:head>
	<title>{tenant.name}</title>
</svelte:head>

<Hero />
<Services {services} />
