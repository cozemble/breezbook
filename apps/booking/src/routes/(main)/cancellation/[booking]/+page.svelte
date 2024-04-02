<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import CancellationGranted from '$lib/sections/cancellation/CancellationGranted.svelte';

	const { cancellationGrant } = $page.data as PageData;
</script>

<CancellationGranted {cancellationGrant} />
