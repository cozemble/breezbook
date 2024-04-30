import {expect, test} from 'vitest';
import {InMemorySynchronisationIdRepository} from '../../src/inngest/dataSynchronisation.js';
import {id} from '@breezbook/packages-core';
import {StubAirtableClient} from '../../src/airtable/airtableClient.js';
import {applyAirtablePlan} from '../../src/airtable/applyAirtablePlan.js';
import {exemplarBookingMutations} from "./exemplarBookingMutations.js";
import {natsCarWashAirtableMapping} from "../../src/airtable/natsCarWashAirtableMapping.js";

test('integrating from breezbook to Nats airtable tables', async () => {
    const idRepo = new InMemorySynchronisationIdRepository();
    await idRepo.setTargetId('services', {id: 'smallCarWash'}, 'Services', id('rec1'));
    const stubAirtableClient = new StubAirtableClient();

    for (const mutation of exemplarBookingMutations) {
        await applyAirtablePlan(idRepo, stubAirtableClient, natsCarWashAirtableMapping, mutation);
    }
    const customerRecord = stubAirtableClient.records.find((record) => record.table === 'Customers');
    expect(customerRecord).toBeDefined();
    expect(customerRecord!.fields).toEqual({
        'First name': 'Mike',
        'Last name': 'Hogan',
        Email: 'mike@email.com',
        Phone: '23432432'
    });
    const bookingRecord = stubAirtableClient.records.find((record) => record.table === 'Bookings');
    expect(bookingRecord).toBeDefined();
    expect(bookingRecord!.fields).toEqual({
        Customer: ['rec100'],
        Service: ['rec1'],
        "Car details": [
            "rec102"
        ],
        'Due Date': '2024-04-02',
        Time: '09:00 to 13:00',
        'First line of address': '11 Main Street',
        Postcode: 'X1Y2'
    });
    const carDetailsRecord = stubAirtableClient.records.find((record) => record.table === 'Car details');
    expect(carDetailsRecord).toBeDefined();
    expect(carDetailsRecord!.fields).toEqual({
        Make: 'Honda',
        Model: 'Accord',
        'Year and colour': '2021 Silver'
    });
});