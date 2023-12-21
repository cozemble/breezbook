import express from 'express';
import {getServiceAvailability} from "./express/getServiceAvailability.js";

const DEFAULT_PORT = 3000;
const app = express();
const port = process.env.PORT ?? DEFAULT_PORT;

app.post('/api/:tenantId/service/:serviceId/availability/', getServiceAvailability);

app.listen(port, () => console.log(`Server running at http://localhost:${port}/`));