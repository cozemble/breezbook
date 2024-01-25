import { inngest } from '$lib/inngest/client';

export async function GET() {
	const email = 'test@email.com';

	await inngest.send({
		name: 'test/hello.world',
		data: {
			email
		}
	});
	return new Response('OK', { status: 200 });
}
