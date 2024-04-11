import { PubSub } from "@google-cloud/pubsub";

/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {PubSub.Message} message The Pub/Sub message.
 * @param {CloudFunctions.Context} context The event metadata.
 */
const helloWorld = (message: PubSub.Message, context: CloudFunctions.Context) => {
	const pubsubMessage = message.data
		? Buffer.from(message.data, 'base64').toString()
		: 'No message payload!';

	console.log(`PubSub message: ${pubsubMessage}`);
};

export { helloWorld };