import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { authRepository, AuthRepository } from './auth.repository';
import {
  AuthResponse,
  AuthTokens,
  LoginDTO,
  RegisterDTO,
  TokenPayload,
  UserProfileResponse,
} from './auth.types';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../middlewares/error.middleware';

const BCRYPT_SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'securelife_jwt_super_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'securelife_refresh_super_secret_key_2026';
const REFRESH_TOKEN_DAYS = 7;

export class AuthService {
  constructor(private readonly repository: AuthRepository = authRepository) {}

  /**
   * Hashea una contraseña en texto plano utilizando bcrypt con 12 rondas de salt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  /**
   * Compara una contraseña en texto plano con un hash bcrypt
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Genera el par de tokens JWT (Access Token y Refresh Token) y persiste el hash del Refresh Token
   */
  async generateTokens(payload: TokenPayload): Promise<AuthTokens> {
    // 1. Access Token de corta duración
    const signOptions: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
    };
    const accessToken = jwt.sign(payload, JWT_SECRET, signOptions);

    // 2. Refresh Token de larga duración (7 días)
    const refreshSignOptions: SignOptions = {
      expiresIn: `${REFRESH_TOKEN_DAYS}d`,
    };
    const refreshToken = jwt.sign({ userId: payload.userId }, JWT_REFRESH_SECRET, refreshSignOptions);

    // 3. Hashear el Refresh Token para almacenarlo de forma segura en PostgreSQL
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    await this.repository.createRefreshToken(payload.userId, tokenHash, expiresAt);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: JWT_EXPIRES_IN,
    };
  }

  /**
   * Registra un nuevo usuario con su perfil asociado en una transacción atómica
   */
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // 1. Validar que el email no esté en uso
    const existingEmail = await this.repository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('El correo electrónico ya se encuentra registrado');
    }

    // 2. Validar que el DNI no esté en uso
    const existingDni = await this.repository.findByDni(data.dni);
    if (existingDni) {
      throw new ConflictError('El número de DNI ingresado ya se encuentra registrado');
    }

    // 3. Hashear la contraseña
    const passwordHash = await this.hashPassword(data.password);

    // 4. Crear el usuario y perfil en BD
    const user = await this.repository.createUserWithProfile({
      email: data.email,
      passwordHash,
      role: data.role || 'CLIENTE',
      firstName: data.firstName,
      lastName: data.lastName,
      dni: data.dni,
      phone: data.phone,
      matriculaSsn: data.matriculaSsn,
    });

    // 5. Emitir tokens de autenticación
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const tokens = await this.generateTokens(tokenPayload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profile: user.profile
          ? {
              firstName: user.profile.firstName,
              lastName: user.profile.lastName,
              dni: user.profile.dni,
              phone: user.profile.phone,
            }
          : null,
      },
      tokens,
    };
  }

  /**
   * Autentica un usuario verificando email o DNI y contraseña
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    const identifier = (data.identifier || data.emailOrDni || data.email || '').trim();
    if (!identifier) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // 1. Buscar usuario por email o DNI
    const user = await this.repository.findByEmailOrDni(identifier);
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // 2. Verificar contraseña con bcrypt
    const isPasswordValid = await this.comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // 3. Generar nuevo par de tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const tokens = await this.generateTokens(tokenPayload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profile: user.profile
          ? {
              firstName: user.profile.firstName,
              lastName: user.profile.lastName,
              dni: user.profile.dni,
              phone: user.profile.phone,
            }
          : null,
      },
      tokens,
    };
  }

  /**
   * Rota el Refresh Token y emite un nuevo par de tokens
   */
  async refreshToken(tokenStr: string): Promise<AuthTokens> {
    try {
      // 1. Verificar la firma y expiración del JWT
      const decoded = jwt.verify(tokenStr, JWT_REFRESH_SECRET) as { userId: string };

      // 2. Verificar existencia y validez del hash en la base de datos
      const tokenHash = crypto.createHash('sha256').update(tokenStr).digest('hex');
      const tokenRecord = await this.repository.findRefreshToken(tokenHash);

      if (!tokenRecord || tokenRecord.revokedAt || new Date() > tokenRecord.expiresAt) {
        throw new UnauthorizedError('Refresh token inválido o expirado');
      }

      // 3. Revocar el token usado (rotación segura de Refresh Tokens)
      await this.repository.revokeRefreshToken(tokenHash);

      // 4. Buscar usuario para emitir nuevo payload
      const user = await this.repository.findById(decoded.userId);
      if (!user || !user.isActive || user.deletedAt) {
        throw new UnauthorizedError('Usuario inactivo o no encontrado');
      }

      // 5. Emitir nuevo par de tokens
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      return this.generateTokens(tokenPayload);
    } catch (error: unknown) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Token de actualización no válido o expirado');
    }
  }

  /**
   * Obtiene la información completa del perfil del usuario autenticado
   */
  async getCurrentUser(userId: string): Promise<UserProfileResponse> {
    const user = await this.repository.findById(userId);
    if (!user || user.deletedAt) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      profile: user.profile
        ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            dni: user.profile.dni,
            phone: user.profile.phone,
            streetAddress: user.profile.streetAddress,
            city: user.profile.city,
            postalCode: user.profile.postalCode,
            province: user.profile.province,
          }
        : null,
      productorProfile: user.productorProfile
        ? {
            matriculaSsn: user.productorProfile.matriculaSsn,
            organismo: user.productorProfile.organismo,
            commissionRate: user.productorProfile.commissionRate.toString(),
          }
        : null,
    };
  }
}

export const authService = new AuthService();
