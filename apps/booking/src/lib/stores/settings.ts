import { createStoreContext } from '$lib/common/helpers/store';
import { localSyncedStore } from '$lib/common/helpers/stores';
import _ from 'lodash';

const SETTINGS_CTX_KEY = 'app-settings';

const createSettingsStore = () => {
	const settings = localSyncedStore<Settings>(SETTINGS_CTX_KEY, {
		checkout: {
			successReturnUrl: null
		}
	});

	const changeSettings = (newSettings: Partial<Settings>) => {
		console.log('changeSettings', newSettings);

		settings.update((st) => _.merge(st, newSettings));
	};

	return {
		...settings,
		changeSettings
	};
};

export const settingsStore = createStoreContext(SETTINGS_CTX_KEY, createSettingsStore);
