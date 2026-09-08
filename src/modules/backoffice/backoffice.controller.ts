import { Request, Response, NextFunction } from 'express';
import { backofficeService } from './backoffice.service';
import { RolEmpleado, RamoSeguro } from '@prisma/client';

export class BackofficeController {
  // ----------------------------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------------------------

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await backofficeService.login(req.body);
      res.status(200).json({
        status: 'success',
        message: 'Autenticación en BackOffice exitosa',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empleadoId = req.empleado!.empleadoId;
      const data = await backofficeService.getProfile(empleadoId);
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // ----------------------------------------------------------------------------
  // EMPLEADOS (ADMIN)
  // ----------------------------------------------------------------------------

  async crearEmpleado(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await backofficeService.crearEmpleado(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Empleado creado correctamente',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async listarEmpleados(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { activo, rol } = req.query;
      const filtros = {
        activo: activo !== undefined ? activo === 'true' : undefined,
        rol: rol ? (String(rol).toUpperCase() as RolEmpleado) : undefined,
      };

      const data = await backofficeService.listarEmpleados(filtros);
      res.status(200).json({
        status: 'success',
        results: data.length,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async cambiarStatusEmpleado(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      const data = await backofficeService.cambiarStatusEmpleado(id, activo);
      res.status(200).json({
        status: 'success',
        message: `Empleado ${activo ? 'activado' : 'desactivado'} con éxito`,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // ----------------------------------------------------------------------------
  // COTIZACIONES
  // ----------------------------------------------------------------------------

  async listarCotizaciones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { estado, ramo } = req.query;
      const filtros = {
        estado: estado ? String(estado) : undefined,
        ramo: ramo ? (String(ramo).toUpperCase() as RamoSeguro) : undefined,
      };

      const data = await backofficeService.listarCotizaciones(filtros);
      res.status(200).json({
        status: 'success',
        results: data.length,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async responderCotizacion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const peritoId = req.empleado!.empleadoId;
      const data = await backofficeService.responderCotizacion(id, req.body, peritoId);
      res.status(200).json({
        status: 'success',
        message: `Cotización ${req.body.estado.toLowerCase()} exitosamente`,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // ----------------------------------------------------------------------------
  // SINIESTROS
  // ----------------------------------------------------------------------------

  async listarSiniestros(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { estado, ramo } = req.query;
      const filtros = {
        estado: estado ? String(estado) : undefined,
        ramo: ramo ? (String(ramo).toUpperCase() as RamoSeguro) : undefined,
      };

      const data = await backofficeService.listarSiniestros(filtros);
      res.status(200).json({
        status: 'success',
        results: data.length,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async evaluarSiniestro(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await backofficeService.evaluarSiniestro(id, req.body);
      res.status(200).json({
        status: 'success',
        message: `Siniestro evaluado y resuelto como ${req.body.estado}`,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // ----------------------------------------------------------------------------
  // ASISTENCIAS Y GRÚAS
  // ----------------------------------------------------------------------------

  async listarGruas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { estado } = req.query;
      const data = await backofficeService.listarGruas({
        estado: estado ? String(estado) : undefined,
      });
      res.status(200).json({
        status: 'success',
        results: data.length,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async derivarGrua(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await backofficeService.derivarGrua(id, req.body);
      res.status(200).json({
        status: 'success',
        message: `Servicio de auxilio derivado al proveedor ${req.body.proveedor}`,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const backofficeController = new BackofficeController();
