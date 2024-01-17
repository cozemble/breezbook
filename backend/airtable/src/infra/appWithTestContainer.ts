import { exec } from 'child-process-promise';
import { closePgPool } from './postgresPool.js';
import { expressApp } from '../express/expressApp.js';
import { DockerComposeEnvironment, StartedDockerComposeEnvironment, Wait } from 'testcontainers';
import { v4 as uuidv4 } from 'uuid';

export function setTestSecretsEncryptionKey(): void {
	process.env.SECRETS_ENCRYPTION_KEY = 'test-encryption-key';
}

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

	// Set environment variables
	process.env.PGHOST = 'localhost';
	process.env.PGPORT = postgresPort.toString();
	process.env.PGDATABASE = environment.POSTGRES_DB;
	process.env.PG_ADMIN_USER = 'postgres';
	process.env.PG_ADMIN_PASSWORD = environment.POSTGRES_PASSWORD;
	process.env.INTERNAL_API_KEY = 'test-api-key';

	process.env.DATABASE_URL = `postgres://${process.env.PG_ADMIN_USER}:${process.env.PG_ADMIN_PASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

	setTestSecretsEncryptionKey();

	console.log('Running migrations...');
	const outcome = await exec(
		`npx postgrator --host localhost --port ${process.env.PGPORT} --database ${process.env.PGDATABASE} --username ${process.env.PG_ADMIN_USER} --password ${process.env.PG_ADMIN_PASSWORD} -m 'migrations/schema/*'` +
			` && npx postgrator --host localhost --port ${process.env.PGPORT} --database ${process.env.PGDATABASE} --username ${process.env.PG_ADMIN_USER} --password ${process.env.PG_ADMIN_PASSWORD} -m 'migrations/data/carwash/*' -t dataversion`
	);
	console.log(outcome.stdout);
	console.error('STDERR:' + outcome.stderr);

	await closePgPool();
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
