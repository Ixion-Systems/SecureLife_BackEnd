import { Request, Response, NextFunction } from 'express';
import { cotizacionObjetoService } from './objeto.service';

export class CotizacionObjetoController {
  async calcularCotizacion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const calculo = await cotizacionObjetoService.calcularCotizacion(req.body);
      res.status(200).json({
        status: 'success',
        data: calculo,
      });
    } catch (error) {
      next(error);
    }
  }

  async crearCotizacion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || null;
      const cotizacion = await cotizacionObjetoService.crearCotizacion(userId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Cotización de Objeto Personal generada exitosamente',
        data: cotizacion,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cotizacion = await cotizacionObjetoService.obtenerPorId(req.params.id);
      res.status(200).json({
        status: 'success',
        data: cotizacion,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cotizacionObjetoController = new CotizacionObjetoController();
