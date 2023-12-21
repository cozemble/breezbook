import {describe, beforeAll, test, expect} from "vitest";
import {appWithTestContainer} from "../src/infra/appWithTestContainer.js";
import {AvailabilityResponse} from "../src/apiTypes.js";

const port = 3002

describe('with a migrated database', () => {
    beforeAll(async () => {
        try {
            await appWithTestContainer(port)
        } catch (e) {
            console.error(e)
            throw e
        }
    }, 1000 * 90)

    test('should be able to get service availability', async () => {
        const fetched = await fetch(`http://localhost:${port}/api/tenant1/service/smallCarWash/availability?fromDate=2023-12-20&toDate=2023-12-23`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        const json = await fetched.json() as AvailabilityResponse

        expect(json.slots['2023-12-19']).toBeUndefined()
        expect(json.slots['2023-12-20']).toHaveLength(3)
        expect(json.slots['2023-12-21']).toHaveLength(3)
        expect(json.slots['2023-12-22']).toHaveLength(3)
        expect(json.slots['2023-12-23']).toHaveLength(3)
        expect(json.slots['2023-12-24']).toBeUndefined()
    })
})
