import { addOnOrder, carwash, environmentId, order, orderLine, priceFns, tenantEnvironment, tenantId } from '@breezbook/packages-core';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestEnvironment, stopTestEnvironment } from './setup.js';
import { StartedDockerComposeEnvironment } from 'testcontainers';
import { fourDaysFromNow, goodCustomer, goodServiceFormData, postOrder } from './helper.js';
import { OrderCreatedResponse } from '@breezbook/backend-api-types';

const expressPort = 3010;
const postgresPort = 54340;
const tenantEnv = tenantEnvironment(environmentId('dev'), tenantId('tenant1'));

describe('Given a migrated database', async () => {
	let testEnvironment: StartedDockerComposeEnvironment;

	beforeAll(async () => {
		testEnvironment = await startTestEnvironment(expressPort, postgresPort);
	}, 1000 * 90);

	afterAll(async () => {
		await stopTestEnvironment(testEnvironment);
	});

	test('can add an order for two car washes, each with different add-ons', async () => {
		const twoServices = order(goodCustomer, [
			orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], fourDaysFromNow, carwash.nineToOne, [goodServiceFormData]),
			orderLine(
				carwash.mediumCarWash.id,
				carwash.mediumCarWash.price,
				[addOnOrder(carwash.wax.id), addOnOrder(carwash.polish.id)],
				fourDaysFromNow,
				carwash.nineToOne,
				[goodServiceFormData]
			)
		]);

		const fetched = await postOrder(
			twoServices,
			priceFns.add(carwash.smallCarWash.price, carwash.wax.price, carwash.mediumCarWash.price, carwash.wax.price, carwash.polish.price),
			expressPort
		);
		if (!fetched.ok) {
			console.error(await fetched.text());
			throw new Error(`Failed to add order`);
		}
		const json = (await fetched.json()) as OrderCreatedResponse;
		expect(json.orderId).toBeDefined();
		expect(json.customerId).toBeDefined();
		expect(json.bookingIds.length).toBe(2);
		expect(json.orderLineIds.length).toBe(2);
	});
});
