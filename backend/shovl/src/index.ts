import { expressApp } from './express/expressApp.js';
import * as dotenv from 'dotenv';

const envPath = process.env.ENV_PATH ?? '.env';
console.log(`Loading environment from ${envPath}`);
dotenv.config({ path: envPath, debug: true, override: true });

const DEFAULT_PORT = 3000;
const app = expressApp();
const port = process.env.PORT ?? DEFAULT_PORT;

app.listen(port, () => console.log(`Server running at http://localhost:${port}/`));
