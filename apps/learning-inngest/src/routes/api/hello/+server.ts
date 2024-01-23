import { inngest } from '$lib/inngest/client';

export async function GET() {
	await inngest.send({
		name: 'test/hello.world',
		data: {
			email: 'testFroSveltekit@example.com'
		}
	});
	return new Response('OK', { status: 200 });
}
