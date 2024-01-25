import { inngest } from '$lib/inngest/client';
import { mandatory } from '@breezbook/packages-core';

export async function GET() {
	const email = mandatory('test@email.com', `email`);

	await inngest.send({
		name: 'test/hello.world',
		data: {
			email
		}
	});
	return new Response('OK', { status: 200 });
}
