import { get, writable } from 'svelte/store';
import { createUID } from '$lib/common/utils';

export interface Notification {
	id: string;
	createdAt: number;
	title: string;
	description?: string;
	icon?: string;

	/** default: neutral */
	type: 'neutral' | 'info' | 'success' | 'error' | 'warning' | 'loading';

	canUserClose?: boolean;
	remove: () => void;
	duration?: number;
}

interface NotificationCreateOptions {
	title: string;
	description?: string;

	/** default: neutral */
	type?: Notification['type'];
	/** custom icon option */
	icon?: string;

	/** default: true */
	canUserClose?: boolean;
	/** Callback when notification is closed */
	onCloseCallback?: () => void;
	duration?: number;
}

//

const notificationStore = writable<Notification[]>([]);

/**
 * Create a notification and add it to the store
 * @param options Notification options
 * @returns notification
 */
const create = (options: NotificationCreateOptions): Notification => {
	const _id = createUID();
	const notification: Notification = {
		id: _id,
		createdAt: Date.now(),
		type: options.type || 'neutral',

		canUserClose: options.canUserClose ?? true,
		remove: () => {
			remove(_id);
			options.onCloseCallback?.();
		},
		...options
	};

	notificationStore.update((notifications) => [...notifications, notification]);

	// Auto close notification
	if (options.duration) {
		setTimeout(() => {
			notification.remove();
		}, notification.duration);
	}

	return notification;
};

const remove = (id: string) => {
	notificationStore.update((notifications) =>
		notifications.filter((notification) => notification.id !== id)
	);
};

export default {
	...notificationStore,
	get,
	create,
	remove
};
