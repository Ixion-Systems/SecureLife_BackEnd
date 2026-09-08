import { Router } from 'express';
import { autoController } from './auto.controller';
import { authenticate, requireRole } from '../../../middlewares/auth.middleware';
import { validateBody } from '../../../middlewares/validate.middleware';
import { crearCotizacionAutoSchema, tasarCotizacionSchema } from './auto.schema';

export const autoRouter = Router();

// Todas las rutas de cotizaciones de autos requieren autenticación JWT
autoRouter.use(authenticate);

// POST / -> crearSolicitud
autoRouter.post('/', validateBody(crearCotizacionAutoSchema), autoController.crearSolicitud);

// GET /mis-solicitudes -> getMisCotizaciones
autoRouter.get('/mis-solicitudes', autoController.getMisCotizaciones);

// GET /admin/pendientes -> requireRole('ADMIN', 'OPERADOR', 'PRODUCTOR_PAS') -> getPendientesAdmin
autoRouter.get(
  '/admin/pendientes',
  requireRole('ADMIN', 'OPERADOR', 'PRODUCTOR_PAS'),
  autoController.getPendientesAdmin
);

// PATCH /admin/:id/tasar -> requireRole('ADMIN', 'OPERADOR') -> tasarCotizacion
autoRouter.patch(
  '/admin/:id/tasar',
  requireRole('ADMIN', 'OPERADOR'),
  validateBody(tasarCotizacionSchema),
  autoController.tasarCotizacion
);
