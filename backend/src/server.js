const { port } = require('./config/env');
const app = require('./app');

app.listen(port, () => console.log(`ClinicFlow API listening on http://localhost:${port}`));
