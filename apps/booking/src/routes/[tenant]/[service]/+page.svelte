<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	const service = data.service;
</script>

<h1 class="text-3xl text-primary">{service.name}</h1>
<p class="text-lg">{service.description}</p>
