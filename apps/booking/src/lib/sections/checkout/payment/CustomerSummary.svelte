<script lang="ts">
	import checkoutStore from '$lib/stores/checkout';

	const {
		customerStore: { customer }
	} = checkoutStore.get();
</script>

<div class="card bg-base-200">
	<div class="card-body p-4 sm:p-8">
		<h1 class="text-xl font-bold">Your Details</h1>

		<div class="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2">
			<div>
				<div class="font-bold opacity-50 text-sm">Name</div>
				<p class="inline">{$customer.firstName} {$customer.lastName}</p>
			</div>

			<div>
				<div class="font-bold opacity-50 text-sm">Email</div>
				<p class="inline">{$customer.email}</p>
			</div>

			{#each Object.entries($customer.formData || {}) as [key, value]}
				<div>
					<div class="font-bold opacity-50 text-sm capitalize">{key}</div>
					<p class="inline">{value}</p>
				</div>
			{/each}

			<div class="card-actions ml-auto justify-end">
				<button class="btn btn-secondary">Edit</button>
			</div>
		</div>
	</div>
</div>
