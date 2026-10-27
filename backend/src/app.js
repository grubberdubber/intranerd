import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { ApiError } from './utils/ApiError.js';
import { sendSuccess } from './utils/response.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFound.js';
import { rateLimit } from './middlewares/rateLimit.js';
import { requestId, securityHeaders } from './middlewares/security.js';
import apiRoutes from './routes/index.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(requestId);
app.use(securityHeaders);
app.use(
  cors({
    origin: env.allowAllOrigins
      ? '*'
      : (origin, callback) => {
          if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
          return callback(new ApiError(403, 'El origen de la petición no está permitido.'));
        },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86400,
  }),
);
app.use(rateLimit);
app.use(morgan(env.isProduction ? 'combined' : 'dev', { skip: () => env.isTest }));

app.use(express.json({ limit: env.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: env.bodyLimit }));

// Archivos subidos (fotos, evidencias, PDFs). Nombres aleatorios y MIME validado.
app.use(
  '/uploads',
  express.static(env.uploadDir, {
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  }),
);

app.get('/', (_req, res) => {
  return sendSuccess(res, {
    name: 'IntraNerd API',
    user: 'Terminal 2 · Backend & Database Engineer',
    health: '/api/v1/health',
    api: '/api/v1',
  });
});

app.use('/api/v1', apiRoutes);
// Alias sin versión para el cliente SPA (config.api.baseUrl = '/api').
app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
