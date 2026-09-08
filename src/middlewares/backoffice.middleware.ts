import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RolEmpleado } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from './error.middleware';
import { prisma } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'securelife_jwt_super_secret_key_2026';

export interface EmpleadoTokenPayload {
  empleadoId: string;
  email: string;
  nombre: string;
  rol: RolEmpleado;
  tipo: 'EMPLEADO';
}

/**
 * Middleware de autenticación exclusivo para personal de BackOffice
 */
export const authenticateEmpleado = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de BackOffice no provisto o formato inválido');
    }

    const token = authHeader.split(' ')[1];

    let decoded: EmpleadoTokenPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as EmpleadoTokenPayload;
    } catch (err: unknown) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('La sesión del empleado ha expirado');
      }
      throw new UnauthorizedError('Credenciales de acceso a BackOffice inválidas');
    }

    if (decoded.tipo !== 'EMPLEADO' || !decoded.empleadoId) {
      throw new UnauthorizedError('El token provisto no corresponde a un perfil de empleado');
    }

    // Verificar vigencia y estado en la base de datos
    const empleado = await prisma.empleado.findUnique({
      where: { id: decoded.empleadoId },
      select: { id: true, email: true, nombre: true, rol: true, activo: true },
    });

    if (!empleado) {
      throw new UnauthorizedError('El empleado ya no existe en el sistema');
    }

    if (!empleado.activo) {
      throw new ForbiddenError('La cuenta de empleado se encuentra inactiva o suspendida');
    }

    req.empleado = {
      empleadoId: empleado.id,
      email: empleado.email,
      nombre: empleado.nombre,
      rol: empleado.rol,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Control de acceso basado en roles para BackOffice (RBAC)
 * El rol ADMIN tiene acceso omnipotente a todos los módulos.
 */
export const requireEmpleadoRol = (...roles: RolEmpleado[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.empleado) {
      throw new UnauthorizedError('Acceso restringido: requiere autenticación de empleado');
    }

    // ADMIN siempre tiene acceso
    if (req.empleado.rol === RolEmpleado.ADMIN) {
      return next();
    }

    if (!roles.includes(req.empleado.rol)) {
      throw new ForbiddenError(
        `Permiso denegado: se requiere uno de los siguientes roles de gestión: [${roles.join(', ')}]`
      );
    }

    next();
  };
};
