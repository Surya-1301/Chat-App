const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Test server running'));

const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`Test server listening on http://127.0.0.1:${PORT}`));