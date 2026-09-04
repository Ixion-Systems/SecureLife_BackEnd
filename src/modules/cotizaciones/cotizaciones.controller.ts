import { Request, Response, NextFunction } from 'express';
import { CotizacionesService } from './cotizaciones.service';
import { CotizacionAutoDTO } from './cotizaciones.schema';

export class CotizacionesController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  public cotizarAuto = async (
    req: Request<unknown, unknown, CotizacionAutoDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const resultado = await this.cotizacionesService.cotizarAuto(req.body);

      res.status(201).json({
        status: 'success',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  };
}
