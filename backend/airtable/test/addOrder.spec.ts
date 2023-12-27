import {beforeAll, describe, expect, test} from "vitest"
import {carwash, customer, isoDate, isoDateFns, Order, order, orderLine} from "@breezbook/packages-core";
import {ErrorResponse, OrderCreatedResponse} from "../src/apiTypes.js";
import {appWithTestContainer} from "../src/infra/appWithTestContainer.js";

const port = 3003
const tomorrow = isoDateFns.addDays(isoDate(), 1);
const dayAfterTomorrow = isoDateFns.addDays(isoDate(), 2);

async function postOrder(order: Order) {
    return await fetch(`http://localhost:${port}/api/tenant1/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
    });
}

describe('with a migrated database', () => {
    beforeAll(async () => {
        try {
            await appWithTestContainer(port)
        } catch (e) {
            console.error(e)
            throw e
        }
    }, 1000 * 90)


    // test("service has a customer form id, and the customer does not have a form response", async () => {
    //     const mike = customer('Mike', 'Hogan', 'mike@email.com');
    //     const twoServices = order(mike, [orderLine(carwash.smallCarWash.id, [carwash.wax.id], tomorrow, carwash.nineToOne), orderLine(carwash.mediumCarWash.id, [carwash.wax.id, carwash.polish.id], dayAfterTomorrow, carwash.nineToOne)])
    //     const response = await postOrder(twoServices);
    //     expect(response.status).toBe(400)
    //     const json = await response.json() as ErrorResponse
    //     expect(json.error).toBe(`Customer form response is required for service ${carwash.smallCarWash.id.value} but none was provided`)
    // })
    //
    // test("service has a customer form id, and the customer has a non-conformant form response", async () => {
    //     expect(true).toBe(false)
    // })
    //
    // test("service has a service form id, and the service does not have a form response", async () => {
    //     expect(true).toBe(false)
    // })
    //
    // test("service has a service form id, and the service has a non-conformant form response", async () => {
    //     expect(true).toBe(false)
    // })

    test("can add an order for two car washes, each with different add-ons", async () => {
        const mike = customer('Mike', 'Hogan', 'mike@email.com');
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
        expect(json.customerId).toBeDefined()
        expect(json.bookingIds.length).toBe(2)
        expect(json.orderLineIds.length).toBe(2)

    })
})
