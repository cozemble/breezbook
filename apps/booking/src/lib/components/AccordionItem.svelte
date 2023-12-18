<script lang="ts">
	import Icon from '@iconify/svelte';

	export let name: string;

	/** keep shorter than 15 for mobile */
	export let label: string;

	export let status: 'success' | 'error' | 'warning' | 'info' | 'default' = 'default';

	/** keep shorter than 25 for mobile */
	export let collapsedDetails: string = '';
</script>

<div class="collapse collapse-arrow border">
	<input type="radio" {name} checked />
	<div
		class="collapse-title flex items-center justify-start
    {status === 'success' && 'text-success'}
    {status === 'error' && 'text-error'}
    {status === 'warning' && 'text-warning'}
    {status === 'info' && 'text-info'}
    {status === 'default' && 'text-secondary'}
  "
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
			{collapsedDetails}
		</span>
	</div>
	<div class="collapse-content">
		<slot />
	</div>
</div>
