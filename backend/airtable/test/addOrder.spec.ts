import {beforeAll, describe, expect, test} from "vitest"
import {carwash, customer, isoDate, isoDateFns, order, orderLine} from "@breezbook/packages-core";
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
        const twoServices = order(mike, [orderLine(carwash.smallCarWash.id, [carwash.wax.id], tomorrow, carwash.nineToOne), orderLine(carwash.mediumCarWash.id, [carwash.wax.id, carwash.polish.id], dayAfterTomorrow, carwash.nineToOne)])

        const fetched = await fetch(`http://localhost:${port}/api/tenant1/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(twoServices)
        })
        if (!fetched.ok) {
            console.error(await fetched.text())
            throw new Error(`Failed to add order`)
        }
        const json = await fetched.json() as OrderCreatedResponse
        expect(json.orderId).toBeDefined()

    })
})
