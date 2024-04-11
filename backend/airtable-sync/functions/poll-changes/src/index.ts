import { PubSub } from "@google-cloud/pubsub";

const pollChanges = (message: PubSub.Message, context: CloudFunctions.Context) => {
	const pubsubMessage = message.data
		? Buffer.from(message.data, 'base64').toString()
		: 'No message payload!';

	console.log(`PubSub message: ${pubsubMessage}`);
};

export { pollChanges };