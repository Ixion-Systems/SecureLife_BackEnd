import { z } from 'zod';
import { Role } from '@prisma/client';

// Contraseña robusta: Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;

// DNI argentino estándar: 7 u 8 dígitos numéricos
const dniRegex = /^\d{7,8}$/;

export const registerSchema = z
  .object({
    email: z
      .string({ required_error: 'El correo electrónico es obligatorio' })
      .email('El formato del correo electrónico es inválido')
      .trim()
      .toLowerCase(),
    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        passwordRegex,
        'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número'
      ),
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    fullName: z.string().trim().optional(),
    dni: z.string().trim().optional(),
    idNumber: z.string().trim().optional(),
    phone: z
      .string()
      .trim()
      .min(6, 'El teléfono debe tener un formato válido')
      .max(25, 'El teléfono no puede superar 25 caracteres')
      .optional(),
    role: z.nativeEnum(Role).optional().default(Role.CLIENTE),
    matriculaSsn: z
      .string()
      .trim()
      .min(3, 'La matrícula SSN debe tener al menos 3 caracteres')
      .optional(),
    termsAccepted: z.boolean().optional(),
  })
  .transform((data) => {
    let firstName = data.firstName;
    let lastName = data.lastName;
    if ((!firstName || !lastName) && data.fullName) {
      const parts = data.fullName.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || parts[0] || '';
    }

    const dni = (data.dni || data.idNumber || '').replace(/\D/g, '');

    return {
      email: data.email,
      password: data.password,
      firstName: firstName || 'Usuario',
      lastName: lastName || 'SecureLife',
      dni,
      phone: data.phone,
      role: data.role,
      matriculaSsn: data.matriculaSsn,
    };
  })
  .refine((data) => dniRegex.test(data.dni), {
    message: 'El DNI debe contener 7 u 8 dígitos numéricos',
    path: ['dni'],
  });

export const loginSchema = z
  .object({
    email: z.string().trim().optional(),
    emailOrDni: z.string().trim().optional(),
    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(1, 'La contraseña es obligatoria'),
    rememberMe: z.boolean().optional(),
  })
  .transform((data) => {
    const rawIdentifier = (data.emailOrDni || data.email || '').trim();
    return {
      identifier: rawIdentifier,
      password: data.password,
      rememberMe: data.rememberMe ?? false,
    };
  })
  .refine((data) => data.identifier.length > 0, {
    message: 'El correo electrónico o DNI es obligatorio',
    path: ['emailOrDni'],
  })
  .refine(
    (data) => {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.identifier);
      const isDni = /^\d{7,8}$/.test(data.identifier.replace(/\D/g, ''));
      return isEmail || isDni;
    },
    {
      message: 'Ingresa un correo electrónico válido o número de DNI (7-8 dígitos)',
      path: ['emailOrDni'],
    }
  );

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'El refresh token es obligatorio' })
    .min(1, 'El refresh token no puede estar vacío'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
