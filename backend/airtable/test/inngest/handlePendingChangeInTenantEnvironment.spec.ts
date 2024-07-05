import {expect, test} from 'vitest';
import {handlePendingChangeInTenantEnvironment} from "../../src/inngest/announceChangesToAirtable.js";

import {PrismockClient} from 'prismock';
import {InMemorySynchronisationIdRepository} from "../../src/inngest/dataSynchronisation.js";
import {StubAirtableClient} from "../../src/airtable/airtableClient.js";
import {upsertCustomer} from "../../src/prisma/breezPrismaMutations.js";
import {DbMutationEvent} from "../../src/prisma/dbtypes.js";
import {carWashMapping} from "../../src/airtable/carWashMapping.js";
import {consoleLogger} from "../../src/inngest/inngestTypes.js";
import {StubInngestStep} from "./stubInngestStep.js";
import {compositeKey} from "../../src/mutation/mutations.js";


test("does nothing when no pending event", async () => {
    const prismock = new PrismockClient();
    const stubStep = new StubInngestStep();
    await handlePendingChangeInTenantEnvironment(prismock, consoleLogger(), () => carWashMapping, async () => null, new InMemorySynchronisationIdRepository(),
        new StubAirtableClient(), "tenantId", "environmentId", stubStep);
    expect(stubStep.stepsRun).toEqual([
        "acquireLock",
        "findNextEvent",
        "releaseLock",
    ])
});

test("applies airtable plan when pending event", async () => {
    const prismock = new PrismockClient();
    const stubStep = new StubInngestStep();
    const synchronisationIdRepository = new InMemorySynchronisationIdRepository();
    const airtableClient = new StubAirtableClient();

    const upsert = upsertCustomer(
        {
            id: "customer#1",
            email: "mike@email.com",
            phone_e164: "+14155552671",
            first_name: "Mike",
            last_name: "Hogan",
            tenant_id: "tenantId",
            environment_id: "environmentId",
        }
    );
    const mutationEvent: DbMutationEvent = {
        id: 1,
        event_data: upsert as any,
        event_type: 'upsert',
        entity_id: "customer#1",
        entity_type: "customers",
        tenant_id: "tenantId",
        environment_id: "environmentId",
        event_time: new Date(),
    };
    await handlePendingChangeInTenantEnvironment(prismock, consoleLogger(), () => carWashMapping, async () => mutationEvent, synchronisationIdRepository,
        airtableClient, "tenantId", "environmentId", stubStep);
    expect(stubStep.stepsRun).toEqual([
        "acquireLock",
        "findNextEvent",
        "replicateEvent",
        "markEventAsReplicated",
        "queueAnotherPendingChange",
        "releaseLock",
    ]);
    expect(airtableClient.records).toHaveLength(1);
    expect(airtableClient.records[0].fields).toEqual({
        "Email": "mike@email.com",
        "First name": "Mike",
        "Last name": "Hogan"
    });
    expect(await synchronisationIdRepository.getTargetId("customers", {id: upsert.create.data.id}, "Customers")).toEqual(compositeKey("airtableRecordId", "rec100"));
    expect((prismock as any).getData()['replicated_mutation_events']).toHaveLength(1)
});