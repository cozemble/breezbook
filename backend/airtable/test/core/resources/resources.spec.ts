import {beforeEach, describe, expect, test} from "vitest";
import {resources} from "../../../src/core/resources/resources.js";
import {PrismockClient} from "prismock";
import {
    environmentId,
    languages,
    locationId,
    resourceType,
    tenantEnvironmentLocation,
    tenantId
} from "@breezbook/packages-types";
import {loadMultiLocationGymTenant, multiLocationGym} from "../../../src/dx/loadMultiLocationGymTenant.js";
import {ErrorResponse, ResourceSummary} from "@breezbook/backend-api-types";
import {PrismaClient} from "@prisma/client";

const env = environmentId(multiLocationGym.environment_id);
const tenant = tenantId(multiLocationGym.tenant_id);
const loc = locationId(multiLocationGym.locationWare)
const tenantEnvLoc = tenantEnvironmentLocation(env, tenant, loc);

describe("given a multi-location gym", () => {
    let prisma: PrismaClient;

    beforeEach(async () => {
        prisma = new PrismockClient()
        await loadMultiLocationGymTenant(prisma)
    })

    test("error if resource type is unknown", async () => {
        const outcome = await resources.listByType(prisma, tenantEnvLoc, resourceType("x"), languages.en) as ErrorResponse;
        expect(outcome.errorCode).toBe(resources.errorCodes.unknownResourceType)
        expect(outcome.errorMessage).toBeDefined()
    });

    test("return resource details when found", async () => {
        const outcome = await resources.listByType(prisma, tenantEnvLoc, resourceType("personal.trainer"), languages.en) as ResourceSummary[];
        expect(outcome).toHaveLength(2)
        const mike = outcome.find(r => r.name === "Mike") as ResourceSummary;
        expect(mike.id).toBe(multiLocationGym.ptMike)
        expect(mike.name).toBe("Mike")
        expect(mike.branding).toBeDefined()
        expect(mike.branding?.images).toHaveLength(1)
        expect(mike.branding?.markup).toHaveLength(1)
        expect(mike.locationIds).toHaveLength(2)
    });

    test("supports multiple languages", async () => {
        const outcome = await resources.listByType(prisma, tenantEnvLoc, resourceType("personal.trainer"), languages.tr) as ResourceSummary[];
        expect(outcome).toHaveLength(2)
        const mike = outcome.find(r => r.name === "Mike") as ResourceSummary;
        expect(mike.branding?.markup).toHaveLength(1)
        expect(mike.branding?.markup?.[0]?.markup).toContain("tutkulu")
    });
});
