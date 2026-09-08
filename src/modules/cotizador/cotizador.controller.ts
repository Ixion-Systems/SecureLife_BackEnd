import { Request, Response, NextFunction } from 'express';
import { cotizadorService, CotizadorService } from './cotizador.service';

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

  calcular = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { marcaCodigo, modeloCodigo, anio, codigoPostal, planCobertura, tieneGnc, ajusteKm } = req.body;

      if (!marcaCodigo || !modeloCodigo || !anio) {
        res.status(400).json({
          status: 'fail',
          message: 'marcaCodigo, modeloCodigo y anio son requeridos.',
        });
        return;
      }

      const result = await this.service.calcularCotizacion({
        marcaCodigo: String(marcaCodigo).toLowerCase(),
        modeloCodigo: String(modeloCodigo).toLowerCase(),
        anio: Number(anio),
        codigoPostal: codigoPostal ? String(codigoPostal) : '1001',
        planCobertura: planCobertura ? String(planCobertura) : 'TODO_RIESGO',
        tieneGnc: Boolean(tieneGnc),
        ajusteKm: ajusteKm ? Number(ajusteKm) : 15000,
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
