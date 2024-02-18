<script lang="ts">
	import { goto } from '$app/navigation';
	import SchemaForm from '$lib/components/schemaForm/SchemaForm.svelte';
	import checkoutStore from '$lib/stores/checkout';

	const {
		customerStore: { customer, schema, errors, submitWithCallback },
		submitOrder
	} = checkoutStore.get();

	const onSubmit = () => {
		submitWithCallback(() => {
			console.log('submitting order');
			submitOrder();
		});
	};

	const onGoBack = () => {
		goto('/checkout');
	};

	$: console.log('customer', $customer);
</script>

<div class="flex items-center justify-center">
	<div class="card flex flex-col w-full max-w-md p-4">
		<div class="card-body">
			<SchemaForm schema={$schema} bind:value={$customer} errors={$errors} />

			<div class="card-actions justify-end">
				<button class="btn btn-info" on:click={onGoBack}>Back</button>
				<button class="btn btn-primary" on:click={onSubmit}>Next</button>
			</div>
		</div>
	</div>
</div>
