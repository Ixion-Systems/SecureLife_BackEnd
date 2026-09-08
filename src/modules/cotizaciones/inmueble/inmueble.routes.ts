import { Router } from 'express';
import { cotizacionInmuebleController } from './inmueble.controller';
import {
  calcularCotizacionInmuebleSchema,
  crearCotizacionInmuebleSchema,
} from './inmueble.schema';
import { validateBody } from '../../../middlewares/validate.middleware';
import { authenticate } from '../../../middlewares/auth.middleware';

export const cotizacionInmuebleRouter = Router();

/**
 * @route POST /api/v1/cotizaciones/inmueble/calcular
 * @desc  Cálculo preliminar e inmediato en tiempo real (público / autenticado)
 */
cotizacionInmuebleRouter.post(
  '/calcular',
  validateBody(calcularCotizacionInmuebleSchema),
  cotizacionInmuebleController.calcularCotizacion
);

/**
 * @route POST /api/v1/cotizaciones/inmueble
 * @desc  Registro y persistencia de cotización de hogar en estado PENDIENTE (Protegido por JWT)
 */
cotizacionInmuebleRouter.post(
  '/',
  authenticate,
  validateBody(crearCotizacionInmuebleSchema),
  cotizacionInmuebleController.crearCotizacion
);
