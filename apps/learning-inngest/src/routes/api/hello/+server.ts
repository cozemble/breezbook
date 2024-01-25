import { inngest } from '$lib/inngest/client';
import { type RequestEvent } from '@sveltejs/kit';
import { mandatory } from '@breezbook/packages-core';

export async function GET(event: RequestEvent) {
	const email = mandatory(event.url.searchParams.get('email'), `email`);

	await inngest.send({
		name: 'test/hello.world',
		data: {
			email
		}
	});
	return new Response('OK', { status: 200 });
}
