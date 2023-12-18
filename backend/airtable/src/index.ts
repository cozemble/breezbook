import express from 'express';
import {handleSlotAvailability} from "./handleSlotAvailability.js";

const DEFAULT_PORT = 3000;

const app = express();
const port = process.env.PORT ?? DEFAULT_PORT;

app.get('/api', (_, res) => res.send('Hello World!'));
app.get('/api/slot/availability', handleSlotAvailability);

app.listen(port, () => console.log(`Server running at http://localhost:${port}/`));