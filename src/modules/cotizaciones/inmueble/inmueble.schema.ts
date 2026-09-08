import { z } from 'zod';

export const TipoInmuebleEnum = z.enum([
  'CASA',
  'DEPARTAMENTO',
  'PH',
  'COUNTRY_BARRIO_CERRADO',
  'LOCAL_COMERCIAL',
  'OTRO',
]);

export const TipoTechoEnum = z.enum(['LOSA', 'CHAPA', 'TEJA']);

export const TipoRevisionEnum = z.enum(['REVISION_ESTANDAR', 'REVISION_EXTENSA']);

/**
 * Esquema de validación para cálculo actuarial preliminar de cotización de inmueble
 */
export const calcularCotizacionInmuebleSchema = z.object({
  tipoInmueble: TipoInmuebleEnum.default('DEPARTAMENTO'),
  superficieM2: z
    .number({ required_error: 'La superficie en m² es obligatoria' })
    .positive('La superficie debe ser un valor positivo mayor a 0 m²')
    .min(10, 'La superficie mínima asegurable es de 10 m²')
    .max(10000, 'La superficie máxima en cotización estándar es de 10.000 m²'),
  codigoPostal: z
    .string()
    .min(1, 'El código postal es obligatorio')
    .max(10, 'Código postal inválido')
    .default('1001'),
  tipoTecho: TipoTechoEnum.default('LOSA'),
  tieneAlarma: z.boolean().default(false),
  tieneRejas: z.boolean().default(false),
  sumaEdificio: z
    .number()
    .nonnegative('La suma del edificio no puede ser negativa')
    .optional()
    .default(0),
  sumaContenido: z
    .number()
    .nonnegative('La suma de contenido no puede ser negativa')
    .optional()
    .default(0),
  sumaElectrodomesticos: z
    .number()
    .nonnegative('La suma de electrodomésticos no puede ser negativa')
    .optional()
    .default(0),
  rcLinderos: z
    .number()
    .nonnegative('La responsabilidad civil hacia linderos no puede ser negativa')
    .optional()
    .default(0),
});

/**
 * Esquema de validación para la creación y persistencia oficial de cotización de inmueble
 */
export const crearCotizacionInmuebleSchema = z.object({
  tipoInmueble: TipoInmuebleEnum,
  superficieM2: z
    .number({ required_error: 'La superficie en m² es obligatoria' })
    .positive('La superficie debe ser mayor a 0 m²')
    .min(10, 'La superficie mínima asegurable es de 10 m²'),
  codigoPostal: z
    .string({ required_error: 'El código postal es requerido' })
    .min(1, 'El código postal no puede estar vacío'),
  tipoTecho: TipoTechoEnum.default('LOSA'),
  tieneAlarma: z.boolean().default(false),
  tieneRejas: z.boolean().default(false),
  sumaEdificio: z.number().nonnegative().optional().default(0),
  sumaContenido: z.number().nonnegative().optional().default(0),
  sumaElectrodomesticos: z.number().nonnegative().optional().default(0),
  rcLinderos: z.number().nonnegative().optional().default(0),

  // Datos de localización del riesgo
  calle: z.string({ required_error: 'La calle del inmueble es obligatoria' }).min(2),
  numero: z.string({ required_error: 'El número de calle es obligatorio' }).min(1),
  piso: z.string().optional().nullable(),
  depto: z.string().optional().nullable(),
  ciudad: z.string({ required_error: 'La ciudad es obligatoria' }).min(2),
  provincia: z.string({ required_error: 'La provincia es obligatoria' }).min(2),
  anioConstruccion: z
    .number()
    .int('El año de construcción debe ser un número entero')
    .min(1850, 'El año de construcción es inválido')
    .max(new Date().getFullYear(), 'El año de construcción no puede ser futuro')
    .optional()
    .nullable(),

  // Archivos de inspección y peritaje
  documentosAdjuntos: z
    .array(z.string().url('Cada documento debe ser una URL válida'))
    .optional()
    .default([]),
  tipoRevision: TipoRevisionEnum.optional().default('REVISION_ESTANDAR'),
  esManual: z.boolean().optional().default(false),
  datosRiesgoAdicionales: z.record(z.unknown()).optional().default({}),
});

export type CalcularCotizacionInmuebleDTO = z.infer<typeof calcularCotizacionInmuebleSchema>;
export type CrearCotizacionInmuebleDTO = z.infer<typeof crearCotizacionInmuebleSchema>;
