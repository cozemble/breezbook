import {expect, test} from 'vitest'
import {handlePaymentIntentSucceeded} from "../../src/inngest/stripePayments.js";
import {PrismockClient} from "prismock";
import {StubInngestStep} from "./stubInngestStep.js";
import {collectingLogger} from "../../src/inngest/inngestTypes.js";
import {mandatory} from "@breezbook/packages-core";

test("does nothing if the webhook cant be found", async () => {
    const prismock = new PrismockClient();
    const stubStep = new StubInngestStep();
    const logger = collectingLogger()
    await handlePaymentIntentSucceeded(prismock, stubStep, logger, "webhookId");
    expect(stubStep.stepsRun).toEqual(['findWebhook'])
    expect(logger.lines()).toEqual(["error: Webhook 'webhookId' not found"])
});

test("does nothing if the webhook is not a stripe payment intent payload", async () => {
    const prismock = new PrismockClient();
    await prismock.received_webhooks.create({
        data: {
            id: "webhookId",
            webhook_id: 'x',
            tenant_id: 'tenant',
            environment_id: 'test',

            payload: {
                _type: 'not stripe.payment.intent.webhook.body'
            },
        }
    });
    const stubStep = new StubInngestStep();
    const logger = collectingLogger()
    await handlePaymentIntentSucceeded(prismock, stubStep, logger, "webhookId");
    expect(stubStep.stepsRun).toEqual(['findWebhook'])
    expect(logger.lines()).toEqual(["error: Webhook 'webhookId' is not a stripe.payment.intent.webhook.body"])
});

test("does nothing if payment intent is missing required metadata", async () => {
    const prismock = new PrismockClient();
    await prismock.received_webhooks.create({
        data: {
            id: "webhookId",
            webhook_id: 'x',
            tenant_id: 'tenant',
            environment_id: 'test',

            payload: {
                _type: 'stripe.payment.intent.webhook.body',
                metadata: {}
            },
        }
    });
    const stubStep = new StubInngestStep();
    const logger = collectingLogger()
    await handlePaymentIntentSucceeded(prismock, stubStep, logger, "webhookId");
    expect(stubStep.stepsRun).toEqual(['findWebhook'])
    expect(logger.lines()).toEqual(["error: Webhook 'webhookId' is missing metadata"])
});

test("stores the stripe payment as an order payment, and apportions it to the bookings", async () => {
    const prismock = new PrismockClient();
    // await prismock.tenants.create({
    //     data:{
    //         tenant_id: 'tenant',
    //         name: 'tenant',
    //         slug: 'tenant'
    //     }
    // });
    await prismock.orders.create({
        data: {
            id: 'order#20',
            tenant_id: 'tenant',
            environment_id: 'test',
            customer_id: 'customer#1',
            total_price_in_minor_units: 52858,
            total_price_currency: 'gbp',
            payment_method: 'upfront'
        }
    });
    await prismock.order_lines.createMany({
        data: [{
            id: 'orderLine#1',
            order_id: 'order#20',
            tenant_id: 'tenant',
            environment_id: 'test',
            total_price_in_minor_units: 33858,
            total_price_currency: 'gbp',
            date: '2024-05-15',
            add_on_ids: [],
            location_id: 'location#1',
            start_time_24hr: '10:00',
            end_time_24hr: '12:00',
            service_id: 'service#1',
            service_form_data: {},
        }, {
            id: 'orderLine#2',
            order_id: 'order#20',
            tenant_id: 'tenant',
            environment_id: 'test',
            total_price_in_minor_units: 19000,
            total_price_currency: 'gbp',
            date: '2024-05-16',
            add_on_ids: [],
            location_id: 'location#1',
            start_time_24hr: '10:00',
            end_time_24hr: '12:00',
            service_id: 'service#1',
            service_form_data: {},
        }]
    });
    await prismock.received_webhooks.create({
        data: {
            id: "webhookId",
            webhook_id: 'x',
            tenant_id: 'tenant',
            environment_id: 'test',
            payload: {
                _type: 'stripe.payment.intent.webhook.body',
                metadata: {
                    tenantId: 'tenant',
                    orderId: 'order#20',
                    environmentId: 'test'
                },
                amount: 52858,
                currency: 'gbp',
                id: 'paymentIntentId'
            },
        }
    });
    await prismock.bookings.createMany({
        data:[{
            id: 'booking#1',
            tenant_id: 'tenant',
            environment_id: 'test',
            order_line_id: 'orderLine#1',
            order_id: 'order#20',
            service_id: 'service#1',
            location_id: 'location#1',
            date: '2024-05-15',
            add_on_ids: [],
            customer_id: 'customer#1',
            start_time_24hr: '10:00',
            end_time_24hr: '12:00',
            status: 'confirmed'
        },{
            id: 'booking#2',
            tenant_id: 'tenant',
            environment_id: 'test',
            order_line_id: 'orderLine#2',
            order_id: 'order#20',
            service_id: 'service#1',
            location_id: 'location#1',
            date: '2024-05-16',
            add_on_ids: [],
            customer_id: 'customer#1',
            start_time_24hr: '10:00',
            end_time_24hr: '12:00',
            status: 'confirmed'
        }]
    });
    const stubStep = new StubInngestStep();
    const logger = collectingLogger()
    await handlePaymentIntentSucceeded(prismock, stubStep, logger, "webhookId");
    expect(stubStep.stepsRun).toEqual(['findWebhook', 'createOrderPayment', 'findOrderLines', 'findBookings', 'createBookingPayments'])
    expect(logger.lines()).toEqual([])
    const orderPayments = await prismock.order_payments.findMany();
    const orderPayment = mandatory(orderPayments[0], `Order payment not found`);
    expect(orderPayment.amount_in_minor_units).toEqual(52858);
    const [bookingPayment1, bookingPayment2] = await prismock.booking_payments.findMany();
    expect(bookingPayment1.amount_in_minor_units).toEqual(33858);
    expect(bookingPayment2.amount_in_minor_units).toEqual(19000);
});