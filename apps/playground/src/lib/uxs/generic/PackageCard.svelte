<script lang="ts">
	import type { Package, PackageLocation } from '@breezbook/backend-api-types';

	export let packageItem: Package;
	export let packageLocation: PackageLocation;
	export let selected: boolean;
	export let onClick: () => void;

	function formatPrice(pl: PackageLocation): string {
		const firstPrice = pl.prices[0];
		if (!firstPrice) {
			return '';
		}
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: firstPrice.priceCurrency
		}).format(firstPrice.priceWithNoDecimalPlaces / 100);
	}
</script>

<div
	class="card bg-base-100 shadow-xl cursor-pointer transition-all duration-300 {selected ? 'ring-2 ring-primary' : 'ring-2 ring-neutral hover:shadow-2xl'}"
	on:click={onClick}>
	<figure>
		<img src={packageItem.image} alt={packageItem.name} />
	</figure>
	<div class="card-body">
		<h2 class="card-title">{packageItem.name}</h2>
		<p>{packageItem.description}</p>
		<div class="flex justify-between items-center mt-4">
			<span class="text-lg font-semibold">{formatPrice(packageLocation)}</span>
			<span class="text-sm">{packageItem.summary.numberOfUses} sessions</span>
		</div>
	</div>
</div>

<style>
	figure {
		height: 100px;
		overflow: hidden;
	}
</style>