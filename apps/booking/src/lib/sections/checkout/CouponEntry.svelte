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
	<div class="card-body">
		<h1 class="text-lg font-semibold">Coupon</h1>
		<div class="join">
			<input
				type="text"
				name="coupon"
				bind:value
				placeholder="Enter coupon code here"
				class="input input-bordered join-item"
			/>

			<button class="btn btn-secondary join-item" on:click={onApply}>Apply</button>
		</div>
	</div>
</div>
