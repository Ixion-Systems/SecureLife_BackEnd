import bcrypt from 'bcryptjs';
import { prisma } from './database';
import { RolEmpleado } from '@prisma/client';

export async function ensureAdminSeed(): Promise<void> {
  try {
    const adminEmail = 'admin@securelife.com';
    const existing = await prisma.empleado.findUnique({
      where: { email: adminEmail },
    });

    const passwordHash = await bcrypt.hash('AdminSecure2026!', 10);

    if (!existing) {
      await prisma.empleado.create({
        data: {
          id: 'a0000000-0000-0000-0000-000000000001',
          email: adminEmail,
          passwordHash,
          nombre: 'Administrador General SecureLife',
          rol: RolEmpleado.ADMIN,
          activo: true,
        },
      });
      console.log('✅ [Seed Admin] Administrador inicial creado: admin@securelife.com');
    } else {
      // Asegurar que esté activo y con la contraseña vigente
      await prisma.empleado.update({
        where: { email: adminEmail },
        data: {
          passwordHash,
          nombre: 'Administrador General SecureLife',
          rol: RolEmpleado.ADMIN,
          activo: true,
        },
      });
      console.log('✅ [Seed Admin] Administrador verificado y activo.');
    }
  } catch (err: unknown) {
    console.error('⚠️ [Seed Admin] Error al verificar/crear administrador inicial:', err);
  }
}
