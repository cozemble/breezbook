import * as express from 'express';
import { createOrderRequest, handleOutcome, httpJsonResponse, tenantEnvironmentParam, withTwoRequestParams } from '../infra/functionalExpress.js';
import { Order, orderFns, Price } from '@breezbook/packages-core';
import { EverythingForTenant, getEverythingForTenant } from './getEverythingForTenant.js';
import {
	validateAvailability,
	validateCoupon,
	validateCustomerForm,
	validateOrderTotal,
	validateServiceForms,
	validateTimeslotId
} from './addOrderValidations.js';
import { doInsertOrder } from './insertOrder.js';
import { CreateOrderRequest, ErrorResponse, OrderCreatedResponse } from '@breezbook/backend-api-types';
import { PrismaMutations } from '../infra/prismaMutations.js';
import { prismaClient } from '../prisma/client.js';

export const addOrderErrorCodes = {
	customerFormMissing: 'addOrder.customer.form.missing',
	customerFormInvalid: 'addOrder.customer.form.invalid',
	serviceFormMissing: 'addOrder.service.form.missing',
	serviceFormInvalid: 'addOrder.service.form.invalid',
	noAvailability: 'addOrder.no.availability',
	noSuchCoupon: 'addOrder.no.such.coupon',
	expiredCoupon: 'addOrder.expired.coupon',
	wrongTotalPrice: 'addOrder.wrong.total.price',
	noSuchTimeslotId: 'addOrder.no.such.timeslot.id'
};

function withValidationsPerformed<T>(everythingForTenant: EverythingForTenant, order: Order, orderTotal: Price, fn: () => T): ErrorResponse | T {
	const validationFns = [
		() => validateTimeslotId(everythingForTenant, order),
		() => validateCustomerForm(everythingForTenant, order),
		() => validateServiceForms(everythingForTenant, order),
		() => validateAvailability(everythingForTenant, order),
		() => validateCoupon(everythingForTenant, order),
		() => validateOrderTotal(everythingForTenant, order, orderTotal)
	];

	for (const validationFn of validationFns) {
		const validationError = validationFn();
		if (validationError) {
			return validationError;
		}
	}

	return fn();
}

export function doAddOrder(
	everythingForTenant: EverythingForTenant,
	createOrderRequest: CreateOrderRequest
):
	| ErrorResponse
	| {
			_type: 'success';
			prismaMutations: PrismaMutations;
			orderCreatedResponse: OrderCreatedResponse;
	  } {
	return withValidationsPerformed(everythingForTenant, createOrderRequest.order, createOrderRequest.orderTotal, () => {
		return doInsertOrder(
			everythingForTenant.tenantEnvironment,
			createOrderRequest,
			everythingForTenant.businessConfiguration.services,
			everythingForTenant.tenantSettings
		);
	});
}

export async function addOrder(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, tenantEnvironmentParam(), createOrderRequest(), async (tenantEnvironment, createOrderRequest) => {
		const { fromDate, toDate } = orderFns.getOrderDateRange(createOrderRequest.order);
		const everythingForTenant = await getEverythingForTenant(tenantEnvironment, fromDate, toDate);
		const outcome = withValidationsPerformed(everythingForTenant, createOrderRequest.order, createOrderRequest.orderTotal, () => {
			return doAddOrder(everythingForTenant, createOrderRequest);
		});
		const prisma = prismaClient();
		if (outcome._type === 'error.response') {
			return handleOutcome(res, prisma, outcome);
		}
		const { prismaMutations, orderCreatedResponse } = outcome;
		await handleOutcome(res, prisma, prismaMutations, httpJsonResponse(200, orderCreatedResponse));
	});
}
