import {describe, beforeAll, test} from "vitest";
import {appWithTestContainer} from "../src/infra/appWithTestContainer.js";

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
        const fetched = await fetch(`http://localhost:${port}/api/tenant1/service/smallCarWash/availability?fromDate=2023-12-20&toDate=2023-12-27`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        console.log({fetched})
    })
})
