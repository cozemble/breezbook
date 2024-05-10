import {inngest} from "./client.js";
import {mandatory} from "@breezbook/packages-core";

export const onInngestFailure = inngest.createFunction(
    {
        name: "Send failures to Slack",
        id: "send-failed-function-events-to-slack"
    },
    {event: "inngest/function.failed"},
    async ({event, step}) => {
        console.log(`event = ${JSON.stringify(event)}`)
        await step.run("send-event-to-slack", async () => {
            // const originalEvent = event.data.event;
            const error = event.data.error;

            // Send a message to the Slack webhook URL
            const webhookUrl = mandatory(process.env.SLACK_OPS_CHANNEL_WEBHOOK_URL,`No SLACK_OPS_CHANNEL_WEBHOOK_URL configured`);
            const message = {
                text: `Inngest error : ${error.message}`,
            };

            try {
                const response = await fetch(webhookUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(message),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } catch (error) {
                console.error("Error sending message to Slack webhook:", error);
            }
        });
    }
);