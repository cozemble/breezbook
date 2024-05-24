<script lang="ts">
    import Vapi from "@vapi-ai/web";
    import type {CreateAssistantDTO} from "@vapi-ai/web/api";
    import {baseUrl} from "./config";

    let message: string | null = null

    async function onChat() {
        console.log("Chat to TheSmartWashLtd");
        message = "Starting the call....can take up to 10 seconds"
        const prompt = await fetch(`${baseUrl}/api/dev/thesmartwashltd/thesmartwashltd_dev_location_europe.uk.london/voicebot/vapi/prompt`);
        if (!prompt.ok) {
            message = `Failed to fetch prompt from backend: ${prompt.status} ${prompt.statusText}`
            return;
        }
        const content = await prompt.text()
        const vapi = new Vapi("314b1f44-ad46-4fa8-a548-98956126863e");
        const vapiConfig: CreateAssistantDTO = {
            transcriber: {
                provider: "deepgram",
                model: "nova-2",
                language: "en-GB",
            },
            model: {
                provider: "openai",
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content
                    },
                ],
            },
            voice: {
                provider: "openai",
                voiceId: "onyx",
            },
            name: "Booking Assistant",
            "functions": [
                {
                    "name": "listAvailability",
                    "description": "list available dates, time and prices for a given service, to assist with the booking process",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "serviceId": {
                                "type": "string",
                                "description": "The ID of the service the user is interested in"
                            }
                        }
                    }
                },
                {
                    "name": "bookAppointment",
                    "description": "book a given service at a given date and time for a given phone number",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "serviceId": {
                                "type": "string",
                                "description": "The ID of the service the user is interested in"
                            }
                        }
                    }
                }
            ]
        }
        console.log({vapiConfig})
        vapi.start(vapiConfig);
        vapi.on("speech-start", () => {
            console.log("Assistant speech has started.");
            message = "Call has started"
        });
        vapi.on("speech-end", () => {
            console.log("Assistant speech has ended.");
        });
        vapi.on("call-start", () => {
            vapi.send({
                type: "add-message",
                message: {
                    role: "system",
                    content: "The call has started, please introduce yourself.",
                },
            });
        });
        vapi.on("call-end", () => {
            console.log("Call has ended.");
            message = 'Call ended'
        });
        vapi.on("message", (message) => {
            console.log(message);
        });
        vapi.on("error", (e) => {
            console.error(e);
        });
    }
</script>
<button on:click={onChat}>Chat to TheSmartWashLtd</button>
{#if message}
    <p>{message}</p>
{/if}