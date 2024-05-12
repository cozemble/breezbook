<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import CancellationConfirm from '$lib/sections/cancellation/CancellationConfirm.svelte';
	import { writable } from 'svelte/store';
	import CancellationSuccess from '$lib/sections/cancellation/CancellationSuccess.svelte';

	const { cancellationGrant } = $page.data as PageData;
	const success = writable(false);

	const onSuccess = () => success.set(true);
</script>

{#if $success}
	<CancellationSuccess {cancellationGrant} />
{:else}
	<CancellationConfirm {cancellationGrant} {onSuccess} />
{/if}
