import { afterAll, beforeAll, describe, test, expect } from 'vitest';
import { PrismaSynchronisationIdRepository } from '../../src/inngest/dataSynchronisation.js';
import { prismaClient } from '../../src/prisma/client.js';
import { startTestEnvironment, stopTestEnvironment } from '../setup.js';
import { StartedDockerComposeEnvironment } from 'testcontainers';
import {airtableRecordIdFns} from "../../src/airtable/applyAirtablePlan.js";

const expressPort = 3011;
const postgresPort = 54341;

describe('Given a migrated database', async () => {
	let testEnvironment: StartedDockerComposeEnvironment;

	beforeAll(async () => {
		testEnvironment = await startTestEnvironment(expressPort, postgresPort);
	}, 1000 * 90);

	afterAll(async () => {
		await stopTestEnvironment(testEnvironment);
	});

	test('can CRU a target id', async () => {
		const prisma = prismaClient();
		await prisma.tenants.create({
			data: {
				tenant_id: 'tenant-id',
				name: 'tenant-name',
				slug: 'tenant-slug',
			}
		});
		const repo = new PrismaSynchronisationIdRepository(prisma, 'tenant-id', 'environment-id');
		await repo.setTargetId('customers', { id: 'customer1001' }, 'Customers', airtableRecordIdFns.toCompositeKey('rec875'));
		await repo.setTargetId('customers', { id: 'customer1001' }, 'Customers', airtableRecordIdFns.toCompositeKey('rec876'));
		const retrieved = await repo.getTargetId('customers', { id: 'customer1001' }, 'Customers');
		const airtablRecordId = airtableRecordIdFns.fromCompositeKey(retrieved)
		expect(airtablRecordId).toEqual('rec876');
	});
});
