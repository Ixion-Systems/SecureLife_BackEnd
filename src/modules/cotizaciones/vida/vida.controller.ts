import { Request, Response, NextFunction } from 'express';
import { cotizacionVidaService } from './vida.service';

export class CotizacionVidaController {
  async calcularCotizacion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const calculo = await cotizacionVidaService.calcularCotizacion(req.body);
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
      const cotizacion = await cotizacionVidaService.crearCotizacion(userId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Cotización de Vida generada exitosamente',
        data: cotizacion,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cotizacion = await cotizacionVidaService.obtenerPorId(req.params.id);
      if (!cotizacion) {
        res.status(404).json({
          status: 'fail',
          message: 'Cotización no encontrada',
        });
        return;
      }
      res.status(200).json({
        status: 'success',
        data: cotizacion,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cotizacionVidaController = new CotizacionVidaController();
