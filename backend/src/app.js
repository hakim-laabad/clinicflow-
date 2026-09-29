const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { frontendUrl } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
app.use(helmet());
const isDev = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: frontendUrl === '*' ? true : [frontendUrl, 'http://localhost:5173', /\.vercel\.app$/],
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
