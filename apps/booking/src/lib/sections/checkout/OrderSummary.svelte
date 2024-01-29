<script lang="ts">
	import { cartStore } from '$lib/stores/checkout';
	import { formatPrice } from '$lib/utils';

	const { items } = cartStore.get();

	$: total = $items.reduce((acc, item) => acc + item.calculatedPrice, 0);
</script>

<div class="flex flex-col items-end p-6 gap-6 rounded-box bg-base-200">
	<div class="flex flex-col w-64">
		<!-- subtotal before discount -->

		<div class="flex justify-between">
			<span class="text-sm font-semibold opacity-60">
				Subtotal ({$items.length})
			</span>
			<span class="text-right text-lg font-bold">
				£ {formatPrice(total)}
			</span>
		</div>

		<!-- discounts -->

		<div class="flex justify-between">
			<span class="text-sm font-semibold opacity-60"> 20% off </span>
			<span class="text-right text-base font-semibold text-success">
				-£{formatPrice(total * 0.2)}
			</span>
		</div>

		<div class="divider m-0"></div>
		<!-- total after discount -->

		<div class="flex justify-between">
			<span class="text-lg font-bold text-primary"> Total </span>
			<span class="text-right text-2xl font-bold">
				£ {formatPrice(total * 0.8)}
			</span>
		</div>
	</div>

	<button class="btn btn-primary"> Confirm & Pay </button>
</div>
