import { Router } from 'express';
import { CotizacionesController } from './cotizaciones.controller';
import { CotizacionesService } from './cotizaciones.service';
import { cotizacionAutoSchema } from './cotizaciones.schema';
import { validateBody } from '../../middlewares/validate.middleware';
import { cotizacionInmuebleRouter } from './inmueble/inmueble.routes';

export const cotizacionesRouter = Router();

const cotizacionesService = new CotizacionesService();
const cotizacionesController = new CotizacionesController(cotizacionesService);

cotizacionesRouter.post(
  '/auto',
  validateBody(cotizacionAutoSchema),
  cotizacionesController.cotizarAuto
);

cotizacionesRouter.use('/inmueble', cotizacionInmuebleRouter);

