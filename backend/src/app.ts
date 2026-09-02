import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/error';
import adminRouter from './routes/admin';
import publicOrdersRouter from './routes/public/orders';
import publicProductRouter from './routes/public/product';
import publicSettingsRouter from './routes/public/settings';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    cors({
      origin(origin, callback) {
        // Allow requests with no origin (curl, same-server) and the configured origins.
        if (!origin || env.clientOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'dregital-api' });
  });

  // Public storefront APIs
  app.use('/api/products', publicProductRouter);
  app.use('/api/settings', publicSettingsRouter);
  app.use('/api/orders', publicOrdersRouter);

  // Admin APIs (each sub-route enforces authentication)
  app.use('/api/admin', adminRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
