<script lang="ts">
	import { goto } from '$app/navigation';
	import checkoutStore from '$lib/stores/checkout';
	import notifications from '$lib/stores/notifications';
	import { formatPrice } from '$lib/common/utils';

	const { total, items, submitOrder } = checkoutStore.get();

	const handleSubmit = () => {
		// <!-- TODO proper validation -->
		if (!$items.length) {
			notifications.create({ type: 'error', title: 'Your cart is empty', duration: 3000 });
			return;
		}

		goto('/checkout/details');
	};
</script>

<div class="flex flex-col p-6 gap-6 rounded-box bg-base-200">
	<div class="flex flex-col w-full">
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

	<button class="btn btn-primary" on:click={handleSubmit}> Confirm & Checkout </button>
</div>
