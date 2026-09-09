import { Request, Response, NextFunction } from 'express';
import { dashboardService, DashboardService } from './dashboard.service';
import { UnauthorizedError } from '../../middlewares/error.middleware';
import { RequestAssistanceDTO } from './dashboard.schema';

export class DashboardController {
  constructor(private readonly service: DashboardService = dashboardService) {}

  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Usuario no autenticado');
      }
      const summary = await this.service.getClientSummary(req.user.userId);

      res.status(200).json({
        status: 'success',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  getPolicies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Usuario no autenticado');
      }
      const policies = await this.service.getClientPolicies(req.user.userId);

      res.status(200).json({
        status: 'success',
        results: policies.length,
        data: policies,
      });
    } catch (error) {
      next(error);
    }
  };

  getActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Usuario no autenticado');
      }
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const activity = await this.service.getClientActivity(req.user.userId, limit);

      res.status(200).json({
        status: 'success',
        results: activity.length,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  };

  requestAssistance = async (
    req: Request<unknown, unknown, RequestAssistanceDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Usuario no autenticado');
      }
      const result = await this.service.requestAssistance(req.user.userId, req.body);

      res.status(201).json({
        status: 'success',
        message: 'Solicitud de auxilio registrada exitosamente.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();
