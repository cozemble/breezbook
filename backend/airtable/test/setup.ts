import { StartedDockerComposeEnvironment } from 'testcontainers';
import { appWithTestContainer } from '../src/infra/appWithTestContainer.js';

export async function startTestEnvironment(expressPort: number, postgresPort: number, additionalSetup?: () => Promise<void>) {
	let dockerComposeEnv;
	try {
		dockerComposeEnv = await appWithTestContainer(expressPort, postgresPort);
		if (additionalSetup) {
			await additionalSetup();
		}
	} catch (e) {
		console.error(e);
		throw e;
	}

	return dockerComposeEnv;
}

export async function stopTestEnvironment(dockerComposeEnv: StartedDockerComposeEnvironment) {
	await dockerComposeEnv.down();
}
