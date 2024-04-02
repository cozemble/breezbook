<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import CancellationGranted from '$lib/sections/cancellation/CancellationGranted.svelte';
	import BookingInPast from '$lib/sections/cancellation/BookingInPast.svelte';
	import NotAvailable from '$lib/sections/cancellation/NotAvailable.svelte';
	const { cancellationGrant } = $page.data as PageData;

	const isGranted = cancellationGrant._type === 'cancellation.granted';
	const isInThePast = cancellationGrant._type === 'booking.is.in.the.past';
</script>

{#if isGranted}
	<CancellationGranted {cancellationGrant} />
{:else if isInThePast}
	<BookingInPast />
{:else}
	<NotAvailable />
{/if}
