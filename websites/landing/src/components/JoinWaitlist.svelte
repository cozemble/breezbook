<!-- @component
  A join waitlist component that's been originally created in tojson.dev (cozemble/monorepo)
  and then copied to this project. It's a simple component that allows users to join a waitlist.
-->

<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let value: string;
	let isOpen = false;
	let hasSubmitted = false;
	let errorState = false;

	$: if (value) errorState = false; // clear error when user types

	const clearError = () => (errorState = false);

	// check if user has already submitted email
	onMount(() => {
		const hasSubmittedEmail = localStorage.getItem('hasSubmittedEmail');

		if (hasSubmittedEmail) hasSubmitted = true;
	});

	const validate = (email: string) => {
		const re = /\S+@\S+\.\S+/;
		return re.test(email);
	};

	async function handleSubmit() {
		const fetched = await fetch('https://breezbook-backend-airtable-qwquwvrytq-nw.a.run.app/api/signup/waitlist', {
			method: 'POST',
			body: JSON.stringify({
				_type: 'waitlist.registration',
				email: value
			}),
			headers: { 'Content-Type': 'application/json' }
		});

		if (fetched.ok) {
			return;
		}
	}

	function mainHandler() {
		if (!isOpen) return (isOpen = true);

		const isValid = validate(value);
		if (!isValid) return (errorState = true);

		handleSubmit();
		isOpen = false;
		hasSubmitted = true;

		// save to local storage if user has submitted email
		localStorage.setItem('hasSubmittedEmail', 'true');
	}

	function enterHandler(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;

		// remove focus
		(e.target as HTMLInputElement).blur();
		mainHandler();
	}

	$: buttonText = (isOpen && 'Join Waitlist') || (hasSubmitted && 'Thanks for joining!') || 'Join Waitlist';

	$: tooltipText =
		(errorState && 'Please enter a valid email') ||
		(isOpen && 'We will notify you via email') ||
		(hasSubmitted && 'You have joined the waitlist!') ||
		'Get notified when we release the first version of tojson.';

	$: inputClass =
		(isOpen ? 'w-64 xs-only:h-12 visible ' : 'pointer-events-none p-0 border-0') +
		' ' +
		((errorState && 'input-error') || 'input-primary');

	$: buttonClass =
		(isOpen && 'join-item') +
		' ' +
		((errorState && 'btn-error') || (isOpen && 'btn-primary ') || (hasSubmitted && 'btn-success') || 'btn-secondary');

	$: tooltipClass =
		(errorState && 'tooltip-error tooltip-open') ||
		(isOpen && 'tooltip-primary') ||
		(hasSubmitted && 'tooltip-success') ||
		'tooltip-neutral';
</script>

<div class="tooltip {tooltipClass}" data-tip={tooltipText}>
	<div class="join xs-only:join-vertical">
		<!-- Sliding open like a drawer from the left on desktop, from the top in mobile -->
		<input
			type="email"
			class="input join-item w-0 xs-only:h-0 transition-all duration-200 {inputClass}"
			placeholder="Your email address"
			bind:value
			on:change={clearError}
			on:keypress={enterHandler}
		/>

		<!-- TODO enable when the endpoint is ready -->
		<button class="pr-6 btn {buttonClass}" on:click={mainHandler}>
			<Icon icon={hasSubmitted ? 'mdi:bell-check' : 'mdi:bell'} class="mr-1 text-xl" />
			{buttonText}
		</button>
	</div>
</div>
