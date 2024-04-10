import { expressApp } from '../express/expressApp.js';
import { StartedDockerComposeEnvironment } from 'testcontainers';
import { withMigratedDatabase } from '@breezbook/backend-database';

export async function appWithTestContainer(expressPort: number, postgresPort: number): Promise<StartedDockerComposeEnvironment> {
	const dockerComposeEnv = await withMigratedDatabase(postgresPort);
	const app = expressApp();
	app.listen(expressPort, () => {
		console.log(`Listening on port ${expressPort}`);
	});
	return dockerComposeEnv;
}
