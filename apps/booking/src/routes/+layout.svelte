<script>
	import { browser, dev } from '$app/environment';
	import config from '$lib/common/config';
	import notifications from '$lib/stores/notifications';
	import '$lib/styles/main.css'; // Global styles, needed for TailwindCSS and DaisyUI
	import '@stripe/stripe-js'; // For advanced fraud detection and PCI compliance: https://docs.stripe.com/js/including

	// A notification to show that the app is in testing mode
	if (!dev && config.devMode && browser) {
		const local = localStorage.getItem('testing-alert-shown');

		if (local !== 'false') {
			notifications.create({
				title: 'This is a testing server!',
				description: 'This domain is for testing only. Visit breezbook.me for the live app.',
				type: 'warning',
				canUserClose: true,
				// duration: 2000,
				icon: 'wpf:maintenance',
				onCloseCallback: () => localStorage.setItem('testing-alert-shown', 'false')
			});
		}
	}
</script>

<slot />
