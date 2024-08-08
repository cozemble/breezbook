<script lang="ts">
	import HeaderNav from './HeaderNav.svelte';

	let scrollY = 0;

	$: isScrolled = scrollY > 50;
</script>

<svelte:window bind:scrollY />

<!-- <header class="navbar shadow-sm justify-center"> -->
<header
	class="navbar px-[var(--page-padding)] justify-between
				bg-base-100 transition duration-700
				sticky top-0 left-0 z-50
				{isScrolled ? 'shadow-xl' : 'shadow-sm'}
				"
>
	<a href="/">
		<img src="./breezbook-logo.svg" alt="Breezbook Logo" class="h-6 sm:h-7 md:h-8" />
	</a>

	<HeaderNav />
</header>
