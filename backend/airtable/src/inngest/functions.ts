import { inngest } from './client.js';

export const helloWorld = inngest.createFunction({ id: 'hello-world' }, { event: 'test/hello.world' }, async ({ event, step }) => {
	await step.sleep('wait-a-moment', '1s');
	return { event, body: 'Hello, World!' };
});
