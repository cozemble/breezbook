<script lang="ts">
	import { goto } from '$app/navigation';
	import checkoutStore from '$lib/stores/checkout';
	import notifications from '$lib/stores/notifications';
	import { formatPrice } from '$lib/common/utils';
	import Loading from '$lib/components/Loading.svelte';

	const {
		total,
		items,
		paymentStore: { onSubmit }
	} = checkoutStore.get();

	$: discount = $total?.discount?.amount.value || 0;
	$: _total = $total?.total.amount.value || 0;
	$: subtotal = _total + discount;

	$: isTotalLoading = !$total;
</script>

<div class="flex flex-col items-end p-6 gap-6 rounded-box bg-base-200">
	{#if isTotalLoading}
		<Loading />
	{:else}
		<div class="flex flex-col w-full">
			<!-- subtotal before discount -->

			<div class="flex justify-between">
				<span class="text-sm font-semibold opacity-60">
					Subtotal ({$items.length})
				</span>
				<span class="text-right text-lg font-bold">
					£ {formatPrice(subtotal)}
				</span>
			</div>

			<!-- discounts -->

			{#if discount}
				<div class="flex justify-between">
					<span class="text-sm font-semibold opacity-60"> Discount </span>
					<span class="text-right text-base font-semibold text-success">
						-£{formatPrice(discount)}
					</span>
				</div>
			{/if}

			<div class="divider m-0"></div>
			<!-- total after discount -->

			<div class="flex justify-between">
				<span class="text-lg font-bold text-primary"> Total </span>
				<span class="text-right text-2xl font-bold">
					£ {formatPrice(_total)}
				</span>
			</div>
		</div>

		<button class="btn btn-primary" on:click={onSubmit}> Confirm & Pay </button>
	{/if}
</div>
