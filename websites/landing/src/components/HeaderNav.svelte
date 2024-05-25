<script lang="ts">
	import Icon from '@iconify/svelte';

	const links: {
		text: string;
		href: string;
	}[] = [
		{ text: 'Features', href: '#features' },
		{ text: 'Pricing', href: '/coming-soon' },
		{ text: 'Docs', href: '/coming-soon' },
		{ text: 'Contact', href: '/coming-soon' }
	];
</script>

<nav class="hidden sm:block">
	<ul class="flex">
		{#each links as link}
			<li>
				<a href={link.href} class="btn btn-ghost">
					{link.text}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<div class="drawer drawer-end sm:hidden w-20 p-0 flex justify-end">
	<input id="my-drawer" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content">
		<label for="my-drawer" class="drawer-button btn btn-ghost btn-circle">
			<Icon icon="solar:hamburger-menu-broken" class="text-4xl text-neutral" />
		</label>
	</div>

	<div class="drawer-side">
		<label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"> </label>
		<ul class="menu p-4 w-40 min-h-full bg-base-200 text-base-content">
			{#each links as link}
				<li>
					<a href={link.href} class="link link-hover">
						{link.text}
					</a>
				</li>
			{/each}
		</ul>
	</div>
</div>
