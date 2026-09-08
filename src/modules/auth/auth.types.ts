import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone?: string;
  role?: Role;
  matriculaSsn?: string;
}

export interface LoginDTO {
  identifier?: string;
  email?: string;
  emailOrDni?: string;
  password: string;
  rememberMe?: boolean;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: Role;
    isActive: boolean;
    profile?: {
      firstName: string;
      lastName: string;
      dni: string;
      phone?: string | null;
    } | null;
  };
  tokens: AuthTokens;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  profile?: {
    firstName: string;
    lastName: string;
    dni: string;
    phone?: string | null;
    streetAddress?: string | null;
    city?: string | null;
    postalCode?: string | null;
    province?: string | null;
  } | null;
  productorProfile?: {
    matriculaSsn: string;
    organismo?: string | null;
    commissionRate: string | number;
  } | null;
}
