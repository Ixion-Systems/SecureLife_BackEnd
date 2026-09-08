import { Router } from 'express';
import { cotizacionObjetoController } from './objeto.controller';
import {
  calcularCotizacionObjetoSchema,
  crearCotizacionObjetoSchema,
} from './objeto.schema';
import { validateBody } from '../../../middlewares/validate.middleware';
import { optionalAuthenticate } from '../../../middlewares/auth.middleware';

export const cotizacionObjetoRouter = Router();

/**
 * @route POST /api/v1/cotizaciones/objeto/calcular
 * @desc  Cálculo actuarial preliminar para objetos personales
 */
cotizacionObjetoRouter.post(
  '/calcular',
  validateBody(calcularCotizacionObjetoSchema),
  cotizacionObjetoController.calcularCotizacion
);

/**
 * @route POST /api/v1/cotizaciones/objeto
 * @desc  Registro y persistencia en BD de cotización de objeto personal (ejecuta SP)
 */
cotizacionObjetoRouter.post(
  '/',
  optionalAuthenticate,
  validateBody(crearCotizacionObjetoSchema),
  cotizacionObjetoController.crearCotizacion
);

/**
 * @route GET /api/v1/cotizaciones/objeto/:id
 * @desc  Consulta cotización de objeto personal por ID
 */
cotizacionObjetoRouter.get('/:id', cotizacionObjetoController.obtenerPorId);
