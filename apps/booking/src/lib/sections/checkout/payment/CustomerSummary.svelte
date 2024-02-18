<script lang="ts">
	import checkoutStore from '$lib/stores/checkout';

	const {
		customerStore: { customer }
	} = checkoutStore.get();
</script>

<div class="card bg-base-200">
	<div class="card-body">
		<h1 class="text-xl font-bold">Your Details</h1>

		<div class="flex gap-6">
			<div>
				<div class="font-semibold">Name</div>
				<p class="inline">{$customer.firstName} {$customer.lastName}</p>
			</div>

			<div>
				<div class="font-semibold">Email</div>
				<p class="inline">{$customer.email}</p>
			</div>

			<div class="divider divider-horizontal"></div>

			{#each Object.entries($customer.formData || {}) as [key, value]}
				<div>
					<div class="font-semibold capitalize">{key}</div>
					<p class="inline">{value}</p>
				</div>
			{/each}

			<div class="card-actions ml-auto justify-end">
				<button class="btn btn-secondary">Edit</button>
			</div>
		</div>
	</div>
</div>
