import {expect, test} from 'vitest';
import {
    handlePendingChangeInTenantEnvironment,
    InngestInvocation,
    InngestStep
} from "../../src/inngest/announceChangesToAirtable.js";

import {PrismockClient} from 'prismock';
import {InMemorySynchronisationIdRepository} from "../../src/inngest/dataSynchronisation.js";
import {StubAirtableClient} from "../../src/airtable/airtableClient.js";
import {upsertCustomer} from "../../src/prisma/breezPrismaMutations.js";
import {DbMutationEvent} from "../../src/prisma/dbtypes.js";
import {id} from "@breezbook/packages-core";

class StubStep implements InngestStep {
    constructor(public readonly stepsRun: string[] = [], public readonly eventsSent: InngestInvocation[] = []) {
    }

    async run<T>(name: string, f: () => Promise<T>): Promise<T> {
        this.stepsRun.push(name);
        return await f()
    }

    async send(payload: InngestInvocation): Promise<void> {
        this.eventsSent.push(payload);
    }
}


test("does nothing when no pending event", async () => {
    const prismock = new PrismockClient();
    const stubStep = new StubStep();
    await handlePendingChangeInTenantEnvironment(prismock, async () => null, new InMemorySynchronisationIdRepository(),
        new StubAirtableClient(), "tenantId", "environmentId", stubStep);
    expect(stubStep.stepsRun).toEqual(["findNextEvent"])
});

test("applies airtable plan when pending event", async () => {
    const prismock = new PrismockClient();
    const stubStep = new StubStep();
    const synchronisationIdRepository = new InMemorySynchronisationIdRepository();
    const airtableClient = new StubAirtableClient();

    const upsert = upsertCustomer(
        {
            id: "customer#1",
            email: "mike@email.com",
            first_name: "Mike",
            last_name: "Hogan",
            tenant_id: "tenantId",
            environment_id: "environmentId",
        },
        {
            first_name: "Mike",
            last_name: "Hogan",
        },
        {
            tenant_id_environment_id_email: {
                tenant_id: "tenantId",
                environment_id: "environmentId",
                email: "mike@email.com"
            }
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
    await handlePendingChangeInTenantEnvironment(prismock, async () => mutationEvent, synchronisationIdRepository,
        airtableClient, "tenantId", "environmentId", stubStep);
    expect(stubStep.stepsRun).toEqual(["findNextEvent", "replicateEvent", "markEventAsReplicated", "queueAnotherPendingChange"]);
    expect(airtableClient.records).toHaveLength(1);
    expect(airtableClient.records[0].fields).toEqual({
        "Email": "mike@email.com",
        "First name": "Mike",
        "Last name": "Hogan"
    });
    expect(await synchronisationIdRepository.getTargetId("customers", {id: "customer#1"}, "Customers")).toEqual(id("rec100"));
    expect((prismock as any).getData()['replicated_mutation_events']).toHaveLength(1)
});