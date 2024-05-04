<script lang="ts">
	import { goto } from '$app/navigation';

	import routeStore from '$lib/stores/routes';
	import checkoutStore from '$lib/stores/checkout';
	import notifications from '$lib/stores/notifications';
	import { formatPrice } from '$lib/common/utils';

	import Loading from '$lib/components/Loading.svelte';

	const routes = routeStore.get();
	const { total, items, submitOrder } = checkoutStore.get();

	const handleSubmit = () => {
		// <!-- TODO proper validation -->
		if (!$items.length) {
			notifications.create({ type: 'error', title: 'Your cart is empty', duration: 3000 });
			return;
		}

		goto(routes.checkout.details());
	};

	$: discount = $total?.discount?.amount.value || 0;
	$: _total = $total?.total.amount.value || 0;
	$: subtotal = _total + discount;

	$: isTotalLoading = !$total;
</script>

<div class="flex flex-col p-6 gap-6 rounded-box bg-base-200">
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

		<button class="btn btn-primary" on:click={handleSubmit}> Confirm & Checkout </button>
	{/if}
</div>
