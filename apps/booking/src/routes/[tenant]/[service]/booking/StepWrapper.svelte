<script lang="ts">
	import Loading from '$lib/components/Loading.svelte';
	import Icon from '@iconify/svelte';

	export let open: boolean = false;
	/** keep shorter than 15 for mobile */
	export let label: string;
	export let status: GenericStatus = 'default';
	/** keep shorter than 25 for mobile */
	export let summary: string = '';

	export let onOpen: () => void;

	/** Displays a loading indicator */
	export let loading: boolean = false;
</script>

<!-- 
	@component 
	Display a booking step as an accordion item with a title, status indicator and summary. 
	- On click, the accordion opens and displays the slot content.
 -->

<div class="collapse collapse-arrow border {open && 'collapse-open'}">
	<button
		class="collapse-title flex items-center justify-start
    {status === 'success' && 'text-success'}
    {status === 'error' && 'text-error'}
    {status === 'warning' && 'text-warning'}
    {status === 'info' && 'text-info'}
    {status === 'default' && 'text-secondary'}
  "
		on:click={() => onOpen()}
	>
		<span class="text-base sm:text-lg font-semibold">
			{label}
		</span>

		<!-- status indicator -->
		<span class="ml-3 inline-flex items-center justify-center text-xl">
			{#if status === 'success'}
				<Icon icon="mdi:check-circle" class="text-success" />
			{:else if status === 'error'}
				<Icon icon="mdi:alert-circle" class="text-error" />
			{:else if status === 'warning'}
				<Icon icon="mdi:alert-circle" class="text-warning" />
			{:else if status === 'info'}
				<Icon icon="mdi:information-outline" class="text-info" />
			{/if}
		</span>

		<!-- collapsed details -->
		<span class="ml-auto text-xs sm:text-sm font-normal text-base-content/60">
			{summary}
		</span>
	</button>

	<div class="collapse-content">
		<!-- loading indicator -->
		{#if loading}
			<Loading />
		{:else}
			<slot />
		{/if}
	</div>
</div>
