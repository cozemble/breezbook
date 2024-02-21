<script lang="ts">
	let value = '';
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

			<button class="btn btn-secondary join-item">Apply</button>
		</div>
	</div>
</div>
