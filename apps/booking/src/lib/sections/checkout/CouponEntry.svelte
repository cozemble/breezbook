<script lang="ts">
	import checkoutStore from '$lib/stores/checkout';

	const { couponCode } = checkoutStore.get();
	let value: string | undefined = undefined;

	const onApply = () => {
		couponCode.set(value);
	};

	couponCode.subscribe((val) => {
		value = val;
	});
</script>

<div class="card bg-base-200">
	<div class="card-body p-6">
		<h1 class="text-lg font-semibold mb-4">Coupon</h1>
		<div class="flex flex-col gap-4 w-full">
			<input
				type="text"
				name="coupon"
				bind:value
				placeholder="Enter coupon code here"
				class="input input-bordered w-full"
			/>

			<button class="btn btn-secondary self-end" on:click={onApply}>Apply</button>
		</div>
	</div>
</div>
