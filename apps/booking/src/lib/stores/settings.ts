import { browser } from '$app/environment';
import { createStoreContext } from '$lib/common/helpers/store';
import { writable } from 'svelte/store';

const SETTINGS_CTX_KEY = 'app-settings';

const createSettingsStore = () => {
	const settings: Settings = {
		checkout: {
			successReturnUrl: writable(
				browser
					? window.location.origin +
							'/' +
							window.location.pathname.split('/')[1] +
							'/checkout/success'
					: ''
			) // TODO improve this so won't be weird
		}
	};

	return settings;
};

export const settingsStore = createStoreContext(SETTINGS_CTX_KEY, createSettingsStore);
