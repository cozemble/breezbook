<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1 class="text-3xl text-primary">{data.title}</h1>
<p class="text-lg">{data.content}</p>
