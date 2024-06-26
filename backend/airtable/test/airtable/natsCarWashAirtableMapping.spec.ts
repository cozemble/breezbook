import {expect, test} from 'vitest';
import {InMemorySynchronisationIdRepository} from '../../src/inngest/dataSynchronisation.js';
import {StubAirtableClient} from '../../src/airtable/airtableClient.js';
import {applyAirtablePlan} from '../../src/airtable/applyAirtablePlan.js';
import {exemplarBookingMutations} from "./exemplarBookingMutations.js";
import {natsCarWashAirtableMapping} from "../../src/airtable/natsCarWashAirtableMapping.js";
import {compositeKey} from "../../src/mutation/mutations.js";

test('integrating from breezbook to Nats airtable tables', async () => {
    const idRepo = new InMemorySynchronisationIdRepository();
    await idRepo.setTargetId('services', {id: 'smallCarWash'}, 'Services', compositeKey('airtableRecordId', 'rec1'));
    await idRepo.setTargetId('add_on', {id: 'screenwash_refill_oil_fluids_check'}, 'Add-ons', compositeKey('airtableRecordId', 'rec2'));
    await idRepo.setTargetId('add_on', {id: 'shampoo_headlining'}, 'Add-ons', compositeKey('airtableRecordId', 'rec3'));
    const stubAirtableClient = new StubAirtableClient();

    for (const mutation of exemplarBookingMutations) {
        const outcome = await applyAirtablePlan(idRepo, stubAirtableClient, natsCarWashAirtableMapping, mutation);
        const firstNonSuccess = outcome.find((outcome) => outcome._type !== 'successful.applied.airtable.mapping');
        expect(firstNonSuccess).toBeUndefined()
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
        "Service ID": ['rec1'],
        "Car details": [
            "rec104"
        ],
        "Order line": [
            "rec102"
        ],
        'Due Date': '2024-04-02',
        Time: '09:00 to 13:00',
        'First line of address': '11 Main Street',
        Postcode: 'X1Y2',
        "Add-ons": ['rec2', 'rec3'],
        "Breezbook ID": "050da0be-01f1-4246-8a2e-dd3f691f73fd",
        Status: "cancelled"
    });
    const carDetailsRecord = stubAirtableClient.records.find((record) => record.table === 'Car details');
    expect(carDetailsRecord).toBeDefined();
    expect(carDetailsRecord!.fields).toEqual({
        Make: 'Honda',
        Model: 'Accord',
        'Year and colour': '2021 Silver'
    });
    const bookingPaymentRecord = stubAirtableClient.records.find((record) => record.table === 'Booking payments');
    expect(bookingPaymentRecord).toBeDefined();
    expect(bookingPaymentRecord!.fields).toEqual({
        Booking: ['rec103'],
        Amount: 65.00,
        "Stripe Payment ID": "pi_3PDnrNH2RPqITCMj0vUw0P3K"
    });
    const orderRecord = stubAirtableClient.records.find((record) => record.table === 'Orders');
    expect(orderRecord).toBeDefined();
    expect(orderRecord!.fields).toEqual({
        "Payment method": 'upfront',
    });
    const orderLineRecord = stubAirtableClient.records.find((record) => record.table === 'Order lines');
    expect(orderLineRecord).toBeDefined();
    expect(orderLineRecord!.fields).toEqual({
        Order: ["rec101"],
        Price: 14.00
    });
});
