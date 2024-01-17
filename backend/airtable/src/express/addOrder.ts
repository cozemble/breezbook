import * as express from 'express';
import { createOrderRequest, tenantEnvironmentParam, withTwoRequestParams } from '../infra/functionalExpress.js';
import { Order, orderFns, Price } from '@breezbook/packages-core';
import { EverythingForTenant, getEverythingForTenant } from './getEverythingForTenant.js';
import { validateAvailability, validateCoupon, validateCustomerForm, validateOrderTotal, validateServiceForms } from './addOrderValidations.js';
import { insertOrder } from './insertOrder.js';

export const addOrderErrorCodes = {
	customerFormMissing: 'addOrder.customer.form.missing',
	customerFormInvalid: 'addOrder.customer.form.invalid',
	serviceFormMissing: 'addOrder.service.form.missing',
	serviceFormInvalid: 'addOrder.service.form.invalid',
	noAvailability: 'addOrder.no.availability',
	noSuchCoupon: 'addOrder.no.such.coupon',
	expiredCoupon: 'addOrder.expired.coupon',
	wrongTotalPrice: 'addOrder.wrong.total.price'
};

async function withValidationsPerformed(
	everythingForTenant: EverythingForTenant,
	order: Order,
	orderTotal: Price,
	res: express.Response,
	fn: () => Promise<void>
) {
	const validationFns = [
		() => validateCustomerForm(everythingForTenant, order),
		() => validateServiceForms(everythingForTenant, order),
		() => validateAvailability(everythingForTenant, order),
		() => validateCoupon(everythingForTenant, order),
		() => validateOrderTotal(everythingForTenant, order, orderTotal)
	];

	for (const validationFn of validationFns) {
		const validationError = validationFn();
		if (validationError) {
			res.status(400).send(validationError);
			return;
		}
	}

	await fn();
}

export async function addOrder(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, tenantEnvironmentParam(), createOrderRequest(), async (tenantEnvironment, createOrderRequest) => {
		const { fromDate, toDate } = orderFns.getOrderDateRange(createOrderRequest.order);
		const everythingForTenant = await getEverythingForTenant(tenantEnvironment, fromDate, toDate);
		await withValidationsPerformed(everythingForTenant, createOrderRequest.order, createOrderRequest.orderTotal, res, async () => {
			const response = await insertOrder(tenantEnvironment, createOrderRequest, everythingForTenant.businessConfiguration.services);
			res.status(200).send(response);
		});
	});
}
