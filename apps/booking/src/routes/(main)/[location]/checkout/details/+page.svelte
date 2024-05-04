<script lang="ts">
	import { goto } from '$app/navigation';
	import SchemaForm from '$lib/components/schemaForm/SchemaForm.svelte';
	import checkoutStore from '$lib/stores/checkout';
	import { locationStore } from '$lib/stores/location';
	import routeStore from '$lib/stores/routes';

	const routes = routeStore.get();
	const tenantLocation = locationStore.get();
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
		goto(routes.checkout.main());
	};
</script>

<div class="mb-10">
	<h1 class="text-2xl font-semibold text-primary">Customer Details</h1>
	<p>Please enter your details to complete your booking</p>
</div>

<div class="flex flex-col items-center justify-center">
	<div class="card flex flex-col w-full max-w-lg p- bg-base-200">
		<div class="card-body">
			<SchemaForm
				schema={$schema}
				bind:value={$customer}
				errors={$errors}
				remember={{ enabled: true, key: 'customer-details' }}
				let:clearValues
			>
				<div class="card-actions justify-end">
					<button class="btn btn-info" on:click={onGoBack}>Back</button>
					<button class="btn btn-warning" on:click={clearValues}>Clear</button>
					<button class="btn btn-primary" on:click={onSubmit}>Next</button>
				</div>
			</SchemaForm>
		</div>
	</div>
</div>
