<script lang="ts">
	import { Elements, PaymentElement } from 'svelte-stripe';
	import checkoutStore from '$lib/stores/checkout';

	const {
		paymentStore: { clientSecret, stripe, onSubmit, elements }
	} = checkoutStore.get();
</script>

{#if $stripe && $clientSecret}
	<Elements stripe={$stripe}>
		<form on:submit|preventDefault={onSubmit}>
			<Elements stripe={$stripe} clientSecret={$clientSecret} bind:elements={$elements}>
				<PaymentElement />
			</Elements>

			<button class="btn btn-primary">Pay</button>
		</form>
	</Elements>
{/if}
