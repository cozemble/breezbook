import express from 'express';

const app = express();
const port = process.env.PORT || 3000; // Use system environment variable 'PORT' if defined, 3000 otherwise
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});