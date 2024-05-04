<script lang="ts">
	import tenantStore from '$lib/stores/tenant';
	import type { CancellationGranted } from '@breezbook/backend-api-types';

	import { routeStore } from '$lib/stores/routes';
	const routes = routeStore.get();
	const tenant = tenantStore.get();

	export let cancellationGrant: CancellationGranted;
</script>

<!-- TODO refund amount -->

<div class="w-full flex flex-col gap-4">
	<div class="card bg-success text-success-content">
		<div class="card-body">
			<h1 class="text-4xl font-bold">Booking Canceled</h1>
			<p>Your booking has been successfully canceled.</p>
			<p class="text-sm opacity-50">
				You will receive a refund of {cancellationGrant.refundPercentageAsRatio * 100}% of the total
				amount paid. The refund will be processed within 7-14 business days.
			</p>

			<div class="card-actions mt-8">
				<a href={routes.home()} class="btn btn-ghost">Go to home page</a>
			</div>
		</div>
	</div>

	<div>
		<p class="text-sm opacity-50">
			If you have any questions, please contact us at <a href={routes.home()} class="link"
				>{tenant.name}</a
			>.
		</p>
	</div>
</div>
