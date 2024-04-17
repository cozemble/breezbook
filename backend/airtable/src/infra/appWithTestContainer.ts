import { exec } from 'child-process-promise';
import { expressApp } from '../express/expressApp.js';
import { DockerComposeEnvironment, StartedDockerComposeEnvironment, Wait } from 'testcontainers';
import { v4 as uuidv4 } from 'uuid';
import {prismaClient} from "../prisma/client.js";
import {loadTestCarWashTenant} from "../dx/loadTestCarWashTenant.js";

export async function withMigratedDatabase(postgresPort: number): Promise<StartedDockerComposeEnvironment> {
	const composeAndFileName = 'supabase-min-docker-compose.yml';
	const composeFilePath = '../supabase';
	const testEnvironmentName = uuidv4();

	const environment = {
		TEST_ENVIRONMENT_NAME: testEnvironmentName,
		POSTGRES_PORT: postgresPort.toString(),
		POSTGRES_PASSWORD: 'your-super-secret-and-long-postgres-password',
		POSTGRES_DB: 'postgres',
		JWT_SECRET: 'secret',
		JWT_EXPIRY: '3600'
	};
	const dockerComposeEnvironment = new DockerComposeEnvironment(composeFilePath, composeAndFileName)
		.withWaitStrategy(`${testEnvironmentName}-supabase-db`, Wait.forHealthCheck())
		.withEnvironment(environment);
	const startedEnvironment = await dockerComposeEnvironment.up();
	startedEnvironment.getContainer(`${testEnvironmentName}-supabase-db`);

	process.env.INTERNAL_API_KEY = 'test-api-key';

	process.env.DATABASE_URL = `postgres://postgres:${environment.POSTGRES_PASSWORD}@localhost:${postgresPort}/${environment.POSTGRES_DB}`;

	console.log('Running migrations...');
	const outcome = await exec(
		`npx postgrator --host localhost --port ${postgresPort} --database ${environment.POSTGRES_DB} --username postgres --password ${environment.POSTGRES_PASSWORD} -m 'migrations/schema/*'`
	);
	const prisma = prismaClient();
	await loadTestCarWashTenant(prisma);
	console.log(outcome.stdout);
	console.error('STDERR:' + outcome.stderr);

	console.log('Migrations complete.');

	console.log(`psql connect string = ${process.env.DATABASE_URL}`);
	return startedEnvironment;
}

export async function appWithTestContainer(expressPort: number, postgresPort: number): Promise<StartedDockerComposeEnvironment> {
	const dockerComposeEnv = await withMigratedDatabase(postgresPort);
	const app = expressApp();
	app.listen(expressPort, () => {
		console.log(`Listening on port ${expressPort}`);
	});
	return dockerComposeEnv;
}
