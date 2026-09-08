import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from './error.middleware';
import { TokenPayload } from '../modules/auth/auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'securelife_jwt_super_secret_key_2026';

/**
 * Middleware para extraer, validar el JWT Bearer token e inyectar el usuario en req.user
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de autenticación no provisto o formato inválido');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('El token de autenticación ha expirado');
    }
    throw new UnauthorizedError('Token de autenticación inválido');
  }
};

/**
 * Helper middleware para control de acceso basado en roles (RBAC)
 */
export const requireRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Acceso denegado: se requiere uno de los siguientes roles: [${roles.join(', ')}]`
      );
    }

    next();
  };
};
