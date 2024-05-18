<script lang="ts">
    import Vapi from "@vapi-ai/web";
    import type {CreateAssistantDTO} from "@vapi-ai/web/api";

    let message: string | null = null

    async function onChat() {
        console.log("Chat to TheSmartWashLtd");
        message = "Starting the call...."
        const prompt = await fetch('http://localhost:3000/api/dev/thesmartwashltd/thesmartwashltd_dev_location_europe.uk.london/voicebot/vapi/prompt');
        if(!prompt.ok) {
            message = `Failed to fetch prompt from backend: ${prompt.status} ${prompt.statusText}`
            return;
        }
        const content = await prompt.text()
        const vapi = new Vapi("314b1f44-ad46-4fa8-a548-98956126863e");
        const vapiConfig:CreateAssistantDTO = {
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
            name: "My Inline Assistant",
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