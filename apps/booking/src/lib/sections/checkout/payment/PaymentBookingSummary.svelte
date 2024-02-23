<script lang="ts">
	import { formatPrice } from '$lib/utils';

	export let booking: Booking;

	const { service, time, calculatedPrice, extras } = booking;
</script>

<div class="card bg-base-100">
	<div class="card-body p-4">
		<div class="flex items-start gap-4 w-full">
			<img src={service.image} alt="service banner" class="aspect-square h-8 md:h-14 rounded-md" />

			<div class="flex flex-col">
				<!-- service -->
				<h1 class="link-hover text-md md:text-lg font-semibold">{service.name}</h1>

				<!-- time and date -->
				<div class="text-xs md:text-sm flex gap-2">
					<span>
						{new Date(time.day).toLocaleDateString('en-GB', {
							dateStyle: 'long'
						})}
					</span>
					|
					<span class="whitespace-nowrap"> {time.start} - {time.end}</span>
				</div>
			</div>

			<div class="ml-auto flex flex-col items-end">
				<span>{extras.length || 'no'} extras</span>
				<span class="font-bold">£ {formatPrice(calculatedPrice)}</span>
			</div>
		</div>
	</div>
</div>
