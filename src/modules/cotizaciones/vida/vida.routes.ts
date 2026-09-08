import { Router } from 'express';
import { cotizacionVidaController } from './vida.controller';
import {
  calcularCotizacionVidaSchema,
  crearCotizacionVidaSchema,
} from './vida.schema';
import { validateBody } from '../../../middlewares/validate.middleware';
import { optionalAuthenticate } from '../../../middlewares/auth.middleware';

export const cotizacionVidaRouter = Router();

/**
 * @route POST /api/v1/cotizaciones/vida/calcular
 * @desc  Cálculo matemático actuarial en tiempo real (público / prospectos)
 */
cotizacionVidaRouter.post(
  '/calcular',
  validateBody(calcularCotizacionVidaSchema),
  cotizacionVidaController.calcularCotizacion
);

/**
 * @route POST /api/v1/cotizaciones/vida
 * @desc  Emisión y registro persistente de cotización de vida en BD (ejecuta SP)
 */
cotizacionVidaRouter.post(
  '/',
  optionalAuthenticate,
  validateBody(crearCotizacionVidaSchema),
  cotizacionVidaController.crearCotizacion
);

/**
 * @route GET /api/v1/cotizaciones/vida/:id
 * @desc  Consulta detalle de cotización de vida
 */
cotizacionVidaRouter.get('/:id', cotizacionVidaController.obtenerPorId);
