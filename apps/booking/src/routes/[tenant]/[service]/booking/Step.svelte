<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { U } from 'vitest/dist/types-198fd1d9.js';

	export let open: boolean = false;
	/** keep shorter than 15 for mobile */
	export let label: string;
	export let status: GenericStatus = 'default';
	/** keep shorter than 25 for mobile */
	export let summary: string = '';

	export let onOpen: () => void;

	export let action:
		| {
				label: string;
				disabled?: boolean;
				handle: () => void;
				// loading?: boolean; // <!-- TODO if needed -->
		  }
		| undefined = undefined;

	export let back:
		| {
				label: string;
				handle: () => void;
				disabled?: boolean;
		  }
		| undefined = undefined;
</script>

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
		<slot />

		{#if action}
			<div class="flex justify-end gap-3 mt-2">
				{#if back}
					<button class="btn btn-secondary" on:click={back.handle} disabled={back.disabled}>
						{back.label}
					</button>
				{/if}
				<button class="btn btn-primary" on:click={action.handle} disabled={action.disabled}>
					{action.label}
				</button>
			</div>
		{/if}
	</div>
</div>
