<script lang="ts">
	import bookingStore from '$lib/stores/booking';
	import { formatPrice } from '$lib/common/utils';
	import StepWrapper from './StepWrapper.svelte';

	const {
		extras: { extras, loading, value, step }
	} = bookingStore.get();

	const { open, status, available } = step;

	const onSubmit = () => {
		step.onComplete();
	};

	$: summary = `${$value?.length || 'no'} extras selected`;
</script>

<StepWrapper
	open={$open}
	label="Pick extras"
	status={$status}
	onOpen={step.onOpen}
	{summary}
	loading={$loading}
	disabled={!$available}
>
	{#if !$extras.length}
		<p class="text-center">No extras available.</p>
	{/if}

	{#each $extras as extra, i (i)}
		<div class="form-control">
			<label class="cursor-pointer label">
				<span class="label-text">
					{extra?.description || extra.name}
				</span>

				<span class="flex items-center">
					<span class="label-text mr-4 text-primary">£{formatPrice(extra.price)}</span>

					<input
						type="checkbox"
						bind:checked={extra.selected}
						class="checkbox checkbox-secondary"
					/>
				</span>
			</label>
		</div>
	{/each}

	<div class="flex justify-end gap-3 mt-2">
		<button class="btn btn-secondary" on:click={step.onGoBack}> Back </button>
		<button class="btn btn-primary" on:click={onSubmit}> Next </button>
	</div>
</StepWrapper>
