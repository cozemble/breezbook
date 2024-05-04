<script lang="ts">
	import api from '$lib/common/api';
	import notifications from '$lib/stores/notifications';
	import { routeStore } from '$lib/stores/routes';
	import tenantStore from '$lib/stores/tenant';
	import type { CancellationGranted } from '@breezbook/backend-api-types';

	const tenant = tenantStore.get();
	const routes = routeStore.get();

	export let cancellationGrant: CancellationGranted;
	export let onSuccess: () => void;

	const onConfirmCancellation = async () => {
		const notif = notifications.create({
			type: 'loading',
			title: 'Cancelling booking',
			description: 'Please wait while we cancel your booking'
		});

		await api.booking
			.commitCancellation(
				tenant.slug,
				cancellationGrant.bookingId,
				cancellationGrant.cancellationId
			)
			.then(() => {
				onSuccess();
			})
			.catch((error) => {
				notifications.create({
					type: 'error',
					title: 'Failed to cancel booking',
					description: error.message,
					canUserClose: true
				});
			})
			.finally(() => {
				notif.remove();
			});
	};
</script>

<!-- TODO refund amount -->

<div class="w-full flex flex-col gap-4">
	<div class="card bg-warning text-warning-content">
		<div class="card-body">
			<h1 class="text-4xl font-bold">Cancel Booking?</h1>
			<p>Are you sure you want to cancel your booking?</p>
			<p class="text-sm opacity-50">
				Once you cancel your booking, you will receive a refund of {cancellationGrant.refundPercentageAsRatio *
					100}% of the total amount paid. The refund will be processed within 7-14 business days.
			</p>

			<div class="card-actions mt-8">
				<button class="btn btn-neutral" on:click={onConfirmCancellation}>
					Confirm Cancellation
				</button>
				<a href={routes.home()} class="btn btn-ghost">Go to home page</a>
			</div>
		</div>
	</div>

	<div>
		<p class="text-sm opacity-50">
			If you have any questions, please contact us at <a href={`/`} class="link">{tenant.name}</a>.
		</p>
	</div>
</div>
