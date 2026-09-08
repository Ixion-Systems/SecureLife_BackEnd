import { z } from 'zod';

export const crearCotizacionAutoSchema = z.object({
  esManual: z.boolean().optional().default(false),
  tipoRevision: z.enum(['REVISION_ESTANDAR', 'REVISION_EXTENSA']).optional().default('REVISION_ESTANDAR'),
  marcaCodigo: z.string({ required_error: 'El código de marca es requerido' }).min(1),
  marcaNombre: z.string({ required_error: 'El nombre de marca es requerido' }).min(1),
  modeloCodigo: z.string({ required_error: 'El código de modelo es requerido' }).min(1),
  modeloNombre: z.string({ required_error: 'El nombre de modelo es requerido' }).min(1),
  anio: z
    .number({ required_error: 'El año del vehículo es requerido' })
    .int('El año debe ser un número entero')
    .min(1950, 'Año no admitido')
    .max(new Date().getFullYear() + 2, 'Año no válido'),
  patente: z
    .string({ required_error: 'La patente es requerida' })
    .min(3, 'Patente muy corta')
    .max(12, 'Patente no puede superar 12 caracteres')
    .trim()
    .toUpperCase(),
  codigoPostal: z.string().optional().default('1001'),
  planCobertura: z.string().optional().default('TODO_RIESGO'),
  tieneGnc: z.boolean().optional().default(false),
  kilometrajeAnual: z
    .number()
    .int('Kilometraje debe ser un número entero')
    .positive('Kilometraje debe ser positivo')
    .optional()
    .default(15000),
  valorDeclarado: z.number().positive('El valor declarado debe ser mayor a 0').nullable().optional(),
  datosRiesgo: z.record(z.unknown()).optional().default({}),
  documentosAdjuntos: z.array(z.unknown()).optional().default([]),
});

export const tasarCotizacionSchema = z.object({
  nuevoEstado: z.enum(['COTIZADA', 'APROBADA', 'RECHAZADA'], {
    required_error: 'El nuevo estado es requerido',
    invalid_type_error: 'El estado debe ser COTIZADA, APROBADA o RECHAZADA',
  }),
  primaTasada: z
    .number({ required_error: 'La prima tasada es requerida' })
    .nonnegative('La prima tasada debe ser mayor o igual a 0'),
  sumaTasada: z
    .number({ required_error: 'La suma tasada es requerida' })
    .nonnegative('La suma tasada debe ser mayor o igual a 0'),
  observaciones: z
    .string({ required_error: 'Las observaciones del peritaje son obligatorias' })
    .min(1, 'Las observaciones no pueden estar vacías')
    .trim(),
});

export type CrearCotizacionAutoDTO = z.infer<typeof crearCotizacionAutoSchema>;
export type TasarCotizacionDTO = z.infer<typeof tasarCotizacionSchema>;
