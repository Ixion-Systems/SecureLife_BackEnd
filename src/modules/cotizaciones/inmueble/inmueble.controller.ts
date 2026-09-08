import { Request, Response, NextFunction } from 'express';
import {
  CotizacionInmuebleService,
  cotizacionInmuebleService,
} from './inmueble.service';
import {
  CalcularCotizacionInmuebleDTO,
  CrearCotizacionInmuebleDTO,
} from './inmueble.schema';

export class CotizacionInmuebleController {
  constructor(
    private readonly service: CotizacionInmuebleService = cotizacionInmuebleService
  ) {}

  /**
   * POST /api/v1/cotizaciones/inmueble/calcular
   * Realiza el cálculo técnico actuarial de prima preliminar en tiempo real
   */
  public calcularCotizacion = async (
    req: Request<unknown, unknown, CalcularCotizacionInmuebleDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const resultado = await this.service.calcular(req.body);

      res.status(200).json({
        status: 'success',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/cotizaciones/inmueble
   * Registra y persiste la solicitud oficial de cotización en estado PENDIENTE
   */
  public crearCotizacion = async (
    req: Request<unknown, unknown, CrearCotizacionInmuebleDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId || null;
      const resultado = await this.service.crear(userId, req.body);

      res.status(201).json({
        status: 'success',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const cotizacionInmuebleController = new CotizacionInmuebleController();
