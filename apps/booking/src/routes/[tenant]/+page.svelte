<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>{data.tenant.name}</title>
</svelte:head>

<h1 class="text-4xl">{data.tenant.name}</h1>
<p>{data.tenant.description}</p>
