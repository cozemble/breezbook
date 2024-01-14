<script lang="ts">
	import type { PageData } from './$types';
	import Hero from './Hero.svelte';
	import Services from './Services.svelte';

	export let data: PageData;
	const tenant = data.tenant;
	const services = data.services;
</script>

<svelte:head>
	<title>{tenant.name}</title>
</svelte:head>

<Hero />
<Services {services} />
