<script lang="ts">
    import Vapi from "@vapi-ai/web";

    let message: string | null = null

    function onChat() {
        console.log("Chat to TheSmartWashLtd");
        message = "Starting the call...."
        const vapi = new Vapi("314b1f44-ad46-4fa8-a548-98956126863e");
        vapi.start({
            transcriber: {
                provider: "deepgram",
                model: "nova-2",
                language: "en-US",
            },
            model: {
                provider: "openai",
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant working for a company called 'The Smart Wash Limited'. You can help users with their queries and provide information about the company.  " +
                            "You should always start the conversation, by introducing yourself." +
                            "" +
                            "We offer mobile car wash services in the London and Greater London" +
                            " area. All of our prices are in british pounds. We offer the following services:" +
                            "1. Valet for small cars.  The price starts from 45.00. " +
                            "2. Valet for large cars.  The price starts from 65.00." +
                            "3. Headlight restoration.  The price starts from 30.00." +
                            "We also offer add-ons or extras that can be added to each service.  They are:" +
                            "1. Waxing your car, at a cost of 19.99" +
                            "2. Alloy wheel sealant.  We will add sealant to 4 wheels, at a cost of 39.99" +
                            "3. Deep seat clean.  We will remove hard to shift stains.  The cost for cleaning one seat is 19.99.  Cost for 2 seats is 39.99. Cost for 4 seats is 49.99." +
                            "4. Engine bay detail.  We will clean under the bonnet for you.  Cost is 9.99." +
                            "We have to travel to where your car is, so our bookings are time slots.  The time slots are 9am to 1pm, 1pm to 4pm and 4pm to 6pm.  We try to be as exact as we can in terms of arrival times, but it's London after" +
                            "all and traffic can be hard to predict.  So please be aware that when we say 9am, for example, it would be 10am by the time we get there.  We are open every day, and our prices vary depending on demand.  We will tell" +
                            "you an exact price once you choose a service and day and time.  We offer a cancellation and refund policy, which you can ask about."
                    },
                ],
            },
            voice: {
                provider: "playht",
                voiceId: "jennifer",
            },
            name: "My Inline Assistant",
        });
        vapi.on("speech-start", () => {
            console.log("Assistant speech has started.");
        });
        vapi.on("speech-end", () => {
            console.log("Assistant speech has ended.");
        });
        vapi.on("call-start", () => {
            console.log("Call has started.");
            vapi.send({
                type: "add-message",
                message: {
                    role: "system",
                    content: "The call has started, please introduce yourself.",
                },
            });
            message = 'Call in progress'
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