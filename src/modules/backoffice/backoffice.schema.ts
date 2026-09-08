import { z } from 'zod';
import { RolEmpleado } from '@prisma/client';

export const rolEmpleadoSchema = z.nativeEnum(RolEmpleado);

// 1. Auth Schemas
export const loginEmpleadoSchema = z.object({
  email: z.string().email('Formato de correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// 2. Empleados Schemas
export const crearEmpleadoSchema = z.object({
  email: z.string().email('Formato de correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  rol: rolEmpleadoSchema.default(RolEmpleado.COTIZACIONES),
});

export const cambiarStatusEmpleadoSchema = z.object({
  activo: z.boolean({ required_error: 'El campo activo es obligatorio' }),
});

// 3. Cotizaciones BackOffice Schemas
export const responderCotizacionSchema = z.object({
  estado: z.enum(['APROBADA', 'RECHAZADA', 'AJUSTADA']),
  observaciones: z.string().optional(),
  primaAjustada: z.number().min(0, 'La prima ajustada no puede ser negativa').optional(),
  sumaAjustada: z.number().min(0, 'La suma ajustada no puede ser negativa').optional(),
});

// 4. Siniestros BackOffice Schemas
export const evaluarSiniestroSchema = z.object({
  estado: z.enum(['APROBADO', 'RECHAZADO', 'EN_REVISION']),
  montoLiquidado: z.number().min(0).optional(),
  dictamenPerito: z.string().min(5, 'El dictamen del perito debe tener al menos 5 caracteres'),
});

// 5. Grúas / Auxilio BackOffice Schemas
export const derivarGruaSchema = z.object({
  proveedor: z.string().min(2, 'El nombre del proveedor de auxilio es requerido'),
  movilAsignado: z.string().min(2, 'El identificador del móvil o unidad es requerido'),
  etaMinutos: z.number().int().min(1, 'El ETA mínimo es 1 minuto').max(360, 'El ETA máximo es 360 minutos'),
  estado: z.enum(['DERIVADO', 'EN_CAMINO', 'EN_LUGAR', 'FINALIZADO', 'CANCELADO']).default('DERIVADO'),
});

export type LoginEmpleadoDTO = z.infer<typeof loginEmpleadoSchema>;
export type CrearEmpleadoDTO = z.infer<typeof crearEmpleadoSchema>;
export type CambiarStatusEmpleadoDTO = z.infer<typeof cambiarStatusEmpleadoSchema>;
export type ResponderCotizacionDTO = z.infer<typeof responderCotizacionSchema>;
export type EvaluarSiniestroDTO = z.infer<typeof evaluarSiniestroSchema>;
export type DerivarGruaDTO = z.infer<typeof derivarGruaSchema>;
