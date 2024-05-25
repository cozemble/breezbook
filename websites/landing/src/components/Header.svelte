<script lang="ts">
	import HeaderNav from './HeaderNav.svelte';

	let scrollY = 0;

	$: isScrolled = scrollY > 30;

	$: console.log(isScrolled);
</script>

<svelte:window bind:scrollY />

<!-- <header class="navbar shadow-sm justify-center"> -->
<header
	class="navbar px-[var(--page-padding)] justify-between
	bg-base-100
				sticky top-0 left-0 z-50
				{isScrolled ? 'shadow-xl' : 'shadow-sm'}
				"
>
	<a href="/">
		<img src="./breezbook-logo.svg" alt="Breezbook Logo" class="h-7 sm:h-8 md:h-10" />
	</a>

	<HeaderNav />
</header>
