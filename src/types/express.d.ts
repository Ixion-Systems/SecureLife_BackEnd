import { Role, RolEmpleado } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: Role;
      };
      empleado?: {
        empleadoId: string;
        email: string;
        nombre: string;
        rol: RolEmpleado;
      };
    }
  }
}

export {};
