import * as core from '@breezbook/packages-core';
import { writable } from 'svelte/store';

export function createCustomerStore() {
	const customer = writable<core.Customer>(
		core.customer('Mike', 'Hogan', 'mike@email.com', {
			phone: '1234567890',
			firstLineOfAddress: '123 Fake Street',
			postcode: 'AB1 2CD'
		})
	);

	return {
		customer
	};
}
