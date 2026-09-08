import { Request, Response, NextFunction } from 'express';
import { autoService, AutoService } from './auto.service';
import { CrearCotizacionAutoDTO, TasarCotizacionDTO } from './auto.schema';
import { UnauthorizedError } from '../../../middlewares/error.middleware';

export class AutoController {
  constructor(private readonly service: AutoService = autoService) {}

  public crearSolicitud = async (
    req: Request<unknown, unknown, CrearCotizacionAutoDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      const resultado = await this.service.crearSolicitud(req.user.userId, req.body);

      res.status(201).json({
        status: 'success',
        message: 'Solicitud de cotización registrada correctamente',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  public getMisCotizaciones = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      const cotizaciones = await this.service.getMisCotizaciones(req.user.userId);

      res.status(200).json({
        status: 'success',
        results: cotizaciones.length,
        data: cotizaciones,
      });
    } catch (error) {
      next(error);
    }
  };

  public getPendientesAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tipoRevision = req.query.tipoRevision ? String(req.query.tipoRevision) : undefined;
      const pendientes = await this.service.getPendientesAdmin(tipoRevision);

      res.status(200).json({
        status: 'success',
        results: pendientes.length,
        data: pendientes,
      });
    } catch (error) {
      next(error);
    }
  };

  public tasarCotizacion = async (
    req: Request<{ id: string }, unknown, TasarCotizacionDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      const { id } = req.params;
      const resultado = await this.service.tasarCotizacion(id, req.user.userId, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Cotización tasada y actualizada exitosamente',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const autoController = new AutoController();
