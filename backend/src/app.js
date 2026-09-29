const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { frontendUrl } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
const isDev = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: frontendUrl === '*' ? true : [frontendUrl, 'http://localhost:5173', /\.vercel\.app$/],
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

const swaggerUiOptions = {
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js',
  ],
  customSiteTitle: 'ClinicFlow API Docs',
};

app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
