import * as core from '@breezbook/packages-core';

import { createStoreContext } from '$lib/common/helpers/store';
import { localSyncedStore } from '$lib/common/helpers/stores';

const key = 'order-history-store';

type OrderHistoryItem = {
	id: string;
	order: core.Order;
	success: boolean;
	paymentIntent: string;
};

type OrderHistoryItemCreateParams = Omit<OrderHistoryItem, 'id'>;

const orderHistoryStore = createStoreContext(key, () => {
	const items = localSyncedStore<OrderHistoryItem[]>(key, []);

	const addItem = (item: OrderHistoryItemCreateParams) => {
		items.update((prev) => {
			return [
				...prev,
				{
					...item,
					id: item.order.id.value
				}
			];
		});
	};

	const removeItem = (orderId: string) => {
		items.update((prev) => {
			return prev.filter((i) => i.id !== orderId);
		});
	};

	return {
		addItem,
		removeItem,
		items
	};
});

export default orderHistoryStore;
