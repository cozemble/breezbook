import {inngest} from './client.js';
import {prismaClient} from '../prisma/client.js';
import {PrismaClient} from "@prisma/client";
import {DelegatingInngestStep, InngestStep, Logger} from "./inngestTypes.js";
import {PaymentIntentWebhookBody} from "../stripe.js";
import {v4 as uuid} from 'uuid';
import {STRIPE_WEBHOOK_ID} from "../express/stripeEndpoint.js";

const stripePaymentEvents = {
    onPaymentIntentSucceeded: 'stripePaymentEvents/onPaymentIntentSucceeded'
};

export const onPaymentIntentSucceeded = inngest.createFunction(
    {
        id: stripePaymentEvents.onPaymentIntentSucceeded,
    },
    {event: stripePaymentEvents.onPaymentIntentSucceeded},
    async ({event, step, logger}) => {
        const {webhookId} = event.data;
        const prisma = prismaClient();
        await handlePaymentIntentSucceeded(prisma, new DelegatingInngestStep(inngest,step), logger, webhookId);
    }
);

export async function handlePaymentIntentSucceeded(prisma: PrismaClient, step: InngestStep, logger: Logger, webhookId: string) {
    const webhook = await step.run('findWebhook', async () => {
        return await prisma.received_webhooks.findUnique({where: {id: webhookId}});
    })
    if (!webhook) {
        logger.error(`Webhook ${webhookId} not found`);
        return;
    }
    if ((webhook.payload as any)._type !== 'stripe.payment.intent.webhook.body') {
        logger.error(`Webhook ${webhookId} is not a stripe.payment.intent.webhook.body`);
        return;
    }
    const paymentIntent:PaymentIntentWebhookBody = webhook.payload as any;
    if(!paymentIntent.metadata.tenantId || !paymentIntent.metadata.orderId || !paymentIntent.metadata.environmentId) {
        logger.error(`Webhook ${webhookId} is missing metadata`);
        return;
    }
    await step.run('createOrderPayment', async () => {
        return await prisma.order_payments.create({
            data: {
                id: uuid(),
                tenant_id: paymentIntent.metadata.tenantId as string,
                environment_id: paymentIntent.metadata.environmentId as string,
                order_id: paymentIntent.metadata.orderId as string,
                amount_in_minor_units: paymentIntent.amount,
                amount_currency: paymentIntent.currency,
                status: "succeeded",
                provider: STRIPE_WEBHOOK_ID,
                provider_transaction_id: paymentIntent.id,
            }
        });
    });
    const orderLines = await step.run('findOrderLines', async () => {
        return await prisma.order_lines.findMany({where: {order_id: paymentIntent.metadata.orderId as string}});
    });
    const bookings = await step.run('findBookings', async () => {
        return await prisma.bookings.findMany({where: {order_id: paymentIntent.metadata.orderId as string}});
    });
    // const bookingTotal = bookings.reduce((total, booking) => total + booking.total, 0);
}
