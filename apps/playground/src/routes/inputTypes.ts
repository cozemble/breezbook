import {
	addOnId,
	carwash,
	currency,
	type Customer,
	customerId,
	formId,
	id,
	isoDate,
	mandatory,
	orderLine,
	type OrderLine,
	price,
	serviceId
} from '@breezbook/packages-core';

type OrderLineKeys = keyof Omit<OrderLine, '_type' | 'serviceFormData'>;

export type OrderLineInput = {
	[K in OrderLineKeys]?: OrderLine[K] extends unknown[] ? string[] : string;
} & Pick<OrderLine, 'serviceFormData'>;

export function toOrderLine(input: OrderLineInput): OrderLine {
	const serviceIdValue = serviceId(mandatory(input.serviceId, 'No Service ID'));
	const servicePrice = price(
		mandatory(input.servicePrice, 'No service price'),
		currency(mandatory(input.servicePriceCurrency, 'No service price'))
	);
	const addOnIds = (input.addOnIds ?? []).map((id) => addOnId(id));
	const date = isoDate(mandatory(input.date, 'No date'));
	const slot = mandatory(
		carwash.timeslots.find(
			(slot) =>
				slot._type === 'timeslot.spec' && slot.description === mandatory(input.slot, 'No slot')
		),
		'No slot'
	);
	return orderLine(serviceIdValue, addOnIds, date, slot, input.serviceFormData);
}

export function orderLineError(input: OrderLineInput): string | null {
	try {
		toOrderLine(input);
		return null;
	} catch (e: unknown) {
		return e instanceof Error ? e.message : 'Unknown error';
	}
}

type CustomerKeys = keyof Omit<Customer, 'formData'>;

export type CustomerInput = {
	[K in CustomerKeys]?: Customer[K] extends unknown[] ? string[] : string;
} & Pick<Customer, 'formData'>;

export function toCustomer(input: CustomerInput): Customer {
	return {
		id: customerId(),
		firstName: mandatory(input.firstName, 'No first name'),
		lastName: mandatory(input.lastName, 'No last name'),
		email: mandatory(input.email, 'No email'),
		formData: input.formData,
		formId: formId(mandatory(input.formId, 'No form ID'))
	};
}

export function customerError(input: CustomerInput): string | null {
	try {
		toCustomer(input);
		return null;
	} catch (e: unknown) {
		return e instanceof Error ? e.message : 'Unknown error';
	}
}
