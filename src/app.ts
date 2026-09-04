import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { cotizacionesRouter } from './modules/cotizaciones/cotizaciones.routes';
import { errorHandler } from './middlewares/error.middleware';

export const createApp = (): Application => {
  const app = express();

  // 1. Headers de seguridad HTTP con Helmet
  app.use(helmet());

  // 2. Control de Orígenes Cruzados (CORS)
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Body parsers con límites de tamaño
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // 4. Verificación de estado (Health Check)
  app.get('/api/v1/health', (_req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'SecureLife API en funcionamiento',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // 5. Montaje de módulos de dominio
  app.use('/api/v1/cotizaciones', cotizacionesRouter);

  // 6. Manejo de rutas no encontradas (404)
  app.use('*', (_req, res) => {
    res.status(404).json({
      status: 'fail',
      message: 'Recurso no encontrado en el servidor',
    });
  });

  // 7. Middleware centralizado de errores
  app.use(errorHandler);

  return app;
};

export const app = createApp();
