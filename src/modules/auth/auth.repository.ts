import { prisma } from '../../config/database';
import { Role, User, UserProfile, ProductorProfile, RefreshToken } from '@prisma/client';
import { AppError } from '../../middlewares/error.middleware';

export interface UserWithProfiles extends User {
  profile: UserProfile | null;
  productorProfile: ProductorProfile | null;
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role: Role;
  firstName: string;
  lastName: string;
  dni: string;
  phone?: string;
  matriculaSsn?: string;
}

export class AuthRepository {
  /**
   * Ejecuta operaciones de Prisma manejando excepciones de conectividad gracefully
   */
  private async handleDatabaseOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      const errObj = error as { code?: string; message?: string };
      // Código P1001: No se puede alcanzar el servidor de base de datos
      if (errObj?.code === 'P1001' || errObj?.message?.includes("Can't reach database server")) {
        throw new AppError(
          'El servicio de base de datos PostgreSQL no se encuentra accesible. Verifique que el contenedor Docker esté activo (docker compose up -d).',
          503
        );
      }
      throw error;
    }
  }

  /**
   * Busca un usuario por su dirección de correo electrónico
   */
  async findByEmail(email: string): Promise<UserWithProfiles | null> {
    return this.handleDatabaseOperation(async () => {
      return prisma.user.findUnique({
        where: { email },
        include: {
          profile: true,
          productorProfile: true,
        },
      });
    });
  }

  /**
   * Busca un usuario por su DNI en UserProfile
   */
  async findByDni(dni: string): Promise<(UserProfile & { user: User }) | null> {
    return this.handleDatabaseOperation(async () => {
      return prisma.userProfile.findUnique({
        where: { dni },
        include: {
          user: true,
        },
      });
    });
  }

  /**
   * Busca un usuario por email o DNI retornando el usuario con todos sus perfiles
   */
  async findByEmailOrDni(identifier: string): Promise<UserWithProfiles | null> {
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      return this.findByEmail(trimmed.toLowerCase());
    }

    const cleanDni = trimmed.replace(/\D/g, '');
    return this.handleDatabaseOperation(async () => {
      const profile = await prisma.userProfile.findUnique({
        where: { dni: cleanDni },
        include: {
          user: {
            include: {
              profile: true,
              productorProfile: true,
            },
          },
        },
      });

      if (!profile || !profile.user) {
        return null;
      }

      return {
        ...profile.user,
        profile: profile.user.profile,
        productorProfile: profile.user.productorProfile,
      };
    });
  }

  /**
   * Busca un usuario por su identificador único (UUID)
   */
  async findById(id: string): Promise<UserWithProfiles | null> {
    return this.handleDatabaseOperation(async () => {
      return prisma.user.findUnique({
        where: { id },
        include: {
          profile: true,
          productorProfile: true,
        },
      });
    });
  }

  /**
   * Crea un usuario y su perfil asociado de manera atómica mediante una transacción
   */
  async createUserWithProfile(data: CreateUserData): Promise<UserWithProfiles> {
    return this.handleDatabaseOperation(async () => {
      return prisma.$transaction(async (tx) => {
        // 1. Crear el registro en users
        const newUser = await tx.user.create({
          data: {
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role,
          },
        });

        // 2. Crear el perfil en user_profiles
        const profile = await tx.userProfile.create({
          data: {
            userId: newUser.id,
            firstName: data.firstName,
            lastName: data.lastName,
            dni: data.dni,
            phone: data.phone ?? null,
          },
        });

        // 3. Si el rol es PRODUCTOR_PAS y se proveyó matrícula SSN, crear productor_profiles
        let productorProfile: ProductorProfile | null = null;
        if (data.role === Role.PRODUCTOR_PAS && data.matriculaSsn) {
          productorProfile = await tx.productorProfile.create({
            data: {
              userId: newUser.id,
              matriculaSsn: data.matriculaSsn,
            },
          });
        }

        return {
          ...newUser,
          profile,
          productorProfile,
        };
      });
    });
  }

  /**
   * Almacena el hash del Refresh Token en base de datos
   */
  async createRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
    return this.handleDatabaseOperation(async () => {
      return prisma.refreshToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt,
        },
      });
    });
  }

  /**
   * Busca un Refresh Token activo por su hash
   */
  async findRefreshToken(tokenHash: string): Promise<(RefreshToken & { user: User }) | null> {
    return this.handleDatabaseOperation(async () => {
      return prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
    });
  }

  /**
   * Revoca un Refresh Token estableciendo revokedAt
   */
  async revokeRefreshToken(tokenHash: string): Promise<void> {
    return this.handleDatabaseOperation(async () => {
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }

  /**
   * Revoca todos los Refresh Tokens de un usuario (para cierre de sesión en todos los dispositivos)
   */
  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    return this.handleDatabaseOperation(async () => {
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }
}

export const authRepository = new AuthRepository();
