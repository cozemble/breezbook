<script lang="ts">
	import { locationStore } from '$lib/stores/location';
	import tenantStore from '$lib/stores/tenant';
	import Icon from '@iconify/svelte';

	const tenant = tenantStore.get();
	const location = locationStore.get();

	$: onlyOneLocation = tenant.locations.length === 1;
</script>

<!-- @component
  Display the current location and a dropdown menu to switch between locations.
-->

<span class="dropdown dropdown-bottom">
	<div
		class="location text-sm font-bold text-accent w-fit flex items-center
    {onlyOneLocation ? 'cursor-default' : 'cursor-pointer hover:underline'}"
		title="See other locations"
		tabindex="0"
		role="button"
	>
		{location.name}

		{#if !onlyOneLocation}
			<span class="icon m-1">
				<Icon icon="solar:alt-arrow-down-bold" class="text-lg" />
			</span>

			<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
			<ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
				{#each tenant.locations as loc}
					<li>
						<a href="/{loc.slug}" class="hover-link" data-sveltekit-reload>
							{loc.name}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</span>

<style>
	.location {
		& .icon {
			opacity: 0;
			pointer-events: none;
			transition: opacity 0.2s;
		}

		&:hover {
			& .icon {
				opacity: 1;
				pointer-events: auto;
			}
		}
	}
</style>
