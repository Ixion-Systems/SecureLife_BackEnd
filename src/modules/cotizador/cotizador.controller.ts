import { Request, Response, NextFunction } from 'express';
import { cotizadorService, CotizadorService } from './cotizador.service';
import { CalcularSimulacionDTO } from './cotizador.schema';

export class CotizadorController {
  constructor(private readonly service: CotizadorService = cotizadorService) {}

  getMarcas = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const marcas = await this.service.getMarcas();
      res.status(200).json({ status: 'success', results: marcas.length, data: marcas });
    } catch (err) {
      next(err);
    }
  };

  getModelos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { marca } = req.query;
      if (!marca || typeof marca !== 'string') {
        res.status(400).json({ status: 'fail', message: 'El parámetro ?marca es requerido.' });
        return;
      }

      const modelos = await this.service.getModelos(marca);
      res.status(200).json({ status: 'success', results: modelos.length, data: modelos });
    } catch (err) {
      next(err);
    }
  };

  calcular = async (
    req: Request<unknown, unknown, CalcularSimulacionDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.service.calcularCotizacion({
        marcaCodigo: req.body.marcaCodigo.toLowerCase(),
        modeloCodigo: req.body.modeloCodigo.toLowerCase(),
        anio: req.body.anio,
        codigoPostal: req.body.codigoPostal,
        planCobertura: req.body.planCobertura,
        tieneGnc: req.body.tieneGnc,
        ajusteKm: req.body.ajusteKm,
      });

      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  sync = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.syncCatalogo();
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  getSyncStatus = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await this.service.getSyncStatus();
      res.status(200).json({ status: 'success', data: status });
    } catch (err) {
      next(err);
    }
  };
}

export const cotizadorController = new CotizadorController();
