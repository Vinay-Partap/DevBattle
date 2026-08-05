import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { config } from './config/env';
import logger from './utils/logger';
import indexRoutes from './routes/index.routes';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { swaggerSpec } from './swagger';

/**
 * Creates and configures the Express application. Kept separate from server.ts
 * so it can be imported by integration tests without binding a port.
 */
export const createApp = (): Application => {
  const app = express();

  // Security & platform headers
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // HTTP request logging -> Winston
  if (!config.isTest) {
    app.use(
      morgan(config.isProduction ? 'combined' : 'dev', {
        stream: { write: (msg: string) => logger.info(msg.trim()) },
      }),
    );
  }

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.use(config.apiPrefix, indexRoutes);

  // API documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req: Request, res: Response) => res.json(swaggerSpec));

  // 404 + central error handler (must be last)
  app.use(notFound);
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) =>
    errorHandler(err, req, res, next),
  );

  return app;
};

export default createApp;
