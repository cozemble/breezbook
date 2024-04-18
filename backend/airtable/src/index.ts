import {expressApp, internalApiPaths} from './express/expressApp.js';
import * as dotenv from 'dotenv';
import {mandatory} from "@breezbook/packages-core";

const envPath = process.env.ENV_PATH ?? '.env';
console.log(`Loading environment from ${envPath}`);
dotenv.config({path: envPath, debug: true, override: true});

const DEFAULT_PORT = 3000;
const app = expressApp();
const port = process.env.PORT ? parseInt(process.env.PORT) : DEFAULT_PORT;

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);

    callOnAppStartEndpoint().catch(e => console.error(e));
});

async function callOnAppStartEndpoint() {
    const apiKey = mandatory(process.env.INTERNAL_API_KEY, `INTERNAL_API_KEY not set`);
    const rootUrl = mandatory(process.env.BREEZBOOK_URL_ROOT, `BREEZBOOK_URL_ROOT not set`);
    const response = await fetch(`${rootUrl}${internalApiPaths.onAppStart}`, {
        method: 'POST',
        headers: {
            "Authorization": apiKey
        }
    });
    console.log(`setupDevEnvironment endpoint response status: ${response.status}`);
    if (response.status !== 200) {
        console.error(`Failed to call setupDevEnvironment endpoint, status code ${response.status}`);
    }
    console.log('setupDevEnvironment endpoint called');
}
