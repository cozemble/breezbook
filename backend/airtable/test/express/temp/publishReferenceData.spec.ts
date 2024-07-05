import {afterAll, beforeAll, describe, test} from 'vitest';
import {StartedDockerComposeEnvironment} from "testcontainers";
import {startTestEnvironment, stopTestEnvironment} from "../../setup.js";

const expressPort = 3012;
const postgresPort = 54342;

describe("given a migrated database", () => {
    let testEnvironment: StartedDockerComposeEnvironment;

    beforeAll(async () => {
        testEnvironment = await startTestEnvironment(expressPort, postgresPort);
    }, 1000 * 90);

    afterAll(async () => {
        await stopTestEnvironment(testEnvironment);
    });

    test("can publish reference data as mutation events", async () => {
        // const prisma = prismaClient()
        // await publishReferenceData(prisma, tenantEnvironment(environmentId("dev"), tenantId("tenant1")))
        // const countMutationEvents = await prisma.mutation_events.count();
        // expect(countMutationEvents).toBeGreaterThan(0)
    })
})
