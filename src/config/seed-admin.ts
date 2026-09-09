import bcrypt from 'bcryptjs';
import { prisma } from './database';
import { RolEmpleado } from '@prisma/client';

export async function ensureAdminSeed(): Promise<void> {
  try {
    const adminEmail = 'admin@securelife.com';
    const existing = await prisma.empleado.findUnique({
      where: { email: adminEmail },
    });

    const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'DevSeedAdmin#2026';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

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
      console.log('[SEED-ADMIN] Administrador inicial creado: admin@securelife.com');
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
      console.log('[SEED-ADMIN] Administrador verificado y activo.');
    }
  } catch (err: unknown) {
    console.error('[SEED-ADMIN] Error al verificar/crear administrador inicial:', err);
  }
}
