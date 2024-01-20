import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { AvailabilityResponse } from '@breezbook/backend-api-types';
import { isoDate, isoDateFns } from '@breezbook/packages-core';
import { StartedDockerComposeEnvironment } from 'testcontainers';
import { startTestEnvironment, stopTestEnvironment } from './setup.js';

const expressPort = 3002;
const postgresPort = 54332;

describe('with a migrated database', () => {
	let testEnvironment: StartedDockerComposeEnvironment;

	beforeAll(async () => {
		testEnvironment = await startTestEnvironment(expressPort, postgresPort);
	}, 1000 * 90);

	afterAll(async () => {
		await stopTestEnvironment(testEnvironment);
	});

	test('should be able to get service availability', async () => {
		const fetched = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/service/smallCarWash/availability?fromDate=2023-12-20&toDate=2023-12-23`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const json = (await fetched.json()) as AvailabilityResponse;

		expect(json.slots['2023-12-19']).toBeUndefined();
		expect(json.slots['2023-12-20']).toHaveLength(3);
		expect(json.slots['2023-12-21']).toHaveLength(3);
		expect(json.slots['2023-12-22']).toHaveLength(3);
		expect(json.slots['2023-12-23']).toHaveLength(3);
		expect(json.slots['2023-12-24']).toBeUndefined();
	});

	test('pricing should be dynamic', async () => {
		const today = isoDate();
		const tomorrow = isoDateFns.addDays(today, 1);
		const twoDaysFromNow = isoDateFns.addDays(today, 2);
		const threeDaysFromNow = isoDateFns.addDays(today, 3);
		const fourDaysFromNow = isoDateFns.addDays(today, 4);

		const fetched = await fetch(
			`http://localhost:${expressPort}/api/dev/tenant1/service/smallCarWash/availability?fromDate=${today.value}&toDate=${fourDaysFromNow.value}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
		const json = (await fetched.json()) as AvailabilityResponse;
		expect(json.slots[today.value][0].priceWithNoDecimalPlaces).toBe(1400);
		expect(json.slots[tomorrow.value][0].priceWithNoDecimalPlaces).toBe(1250);
		expect(json.slots[twoDaysFromNow.value][0].priceWithNoDecimalPlaces).toBe(1100);
		expect(json.slots[threeDaysFromNow.value][0].priceWithNoDecimalPlaces).toBe(1000);
		expect(json.slots[fourDaysFromNow.value][0].priceWithNoDecimalPlaces).toBe(1000);
	});
});
