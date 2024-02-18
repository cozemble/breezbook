<script lang="ts">
	import { goto } from '$app/navigation';
	import checkoutStore from '$lib/stores/checkout';
	import notifications from '$lib/stores/notifications';
	import { formatPrice } from '$lib/utils';

	const {
		total,
		items,
		paymentStore: { onSubmit }
	} = checkoutStore.get();
</script>

<div class="flex flex-col items-end p-6 gap-6 rounded-box bg-base-200">
	<div class="flex flex-col w-64">
		<!-- subtotal before discount -->

		<div class="flex justify-between">
			<span class="text-sm font-semibold opacity-60">
				Subtotal ({$items.length})
			</span>
			<span class="text-right text-lg font-bold">
				£ {formatPrice($total?.orderTotal.amount.value || 0)}
			</span>
		</div>

		<!-- discounts -->

		<div class="flex justify-between">
			<span class="text-sm font-semibold opacity-60"> 20% off </span>
			<span class="text-right text-base font-semibold text-success">
				-£{formatPrice(($total?.orderTotal.amount.value || 0) * 0.2)}
			</span>
		</div>

		<div class="divider m-0"></div>
		<!-- total after discount -->

		<div class="flex justify-between">
			<span class="text-lg font-bold text-primary"> Total </span>
			<span class="text-right text-2xl font-bold">
				£ {formatPrice($total?.orderTotal.amount.value || 0)}
			</span>
		</div>
	</div>

	<button class="btn btn-primary" on:click={onSubmit}> Confirm & Pay </button>
</div>
