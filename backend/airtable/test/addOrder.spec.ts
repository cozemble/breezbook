import {test, describe, beforeAll, expect} from "vitest"
import {customer, isoDate, isoDateFns, order, orderLine} from "../src/types.js";
import {mediumCarWash, nineToOne, polish, smallCarWash, wax} from "./fixtures/carwash.js";
import {OrderCreatedResponse} from "../src/apiTypes.js";
import {appWithTestContainer} from "../src/infra/appWithTestContainer.js";

const port = 3003

describe('with a migrated database', () => {
    beforeAll(async () => {
        try {
            await appWithTestContainer(port)
        } catch (e) {
            console.error(e)
            throw e
        }
    }, 1000 * 90)

    test("can add an order for two car washes, each with different add-ons", async () => {
        const mike = customer('Mike', 'Hogan', 'mike@email.com');
        const tomorrow = isoDateFns.addDays(isoDate(), 1);
        const dayAfterTomorrow = isoDateFns.addDays(isoDate(), 2);
        const twoServices = order(mike, [orderLine(smallCarWash.id, [wax.id], tomorrow, nineToOne), orderLine(mediumCarWash.id, [wax.id, polish.id], dayAfterTomorrow, nineToOne)])

        const fetched = await fetch(`http://localhost:${port}/api/tenant1/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(twoServices)
        })
        if(!fetched.ok) {
            console.error(await fetched.text())
            throw new Error(`Failed to add order`)
        }
        const json = await fetched.json() as OrderCreatedResponse
        expect(json.orderId).toBeDefined()

    })
})
