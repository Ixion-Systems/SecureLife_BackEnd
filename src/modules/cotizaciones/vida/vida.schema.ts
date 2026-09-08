import { z } from 'zod';

export const beneficiarioVidaSchema = z.object({
  nombre: z.string().min(2, 'El nombre del beneficiario es requerido'),
  dni: z.string().min(6, 'El DNI del beneficiario es requerido'),
  parentesco: z.string().default('OTRO'),
  porcentaje: z.number().min(1).max(100, 'El porcentaje individual no puede superar 100%'),
});

export const calcularCotizacionVidaSchema = z.object({
  edad: z.number().int().min(18, 'La edad mínima asegurable es 18 años').max(80, 'La edad máxima asegurable es 80 años'),
  genero: z.string().default('OTRO'),
  ocupacion: z.string().min(2, 'La ocupación es requerida'),
  riesgoOcupacional: z.enum(['BAJO', 'MEDIO', 'ALTO']).default('BAJO'),
  fumador: z.boolean().default(false),
  deportesRiesgo: z.boolean().default(false),
  enfermedadesPreexistentes: z.boolean().default(false),
  capitalAsegurado: z.number().min(500000, 'El capital asegurado mínimo es $500.000'),
});

export const crearCotizacionVidaSchema = calcularCotizacionVidaSchema.extend({
  beneficiarios: z
    .array(beneficiarioVidaSchema)
    .min(1, 'Debe registrar al menos un beneficiario')
    .refine((beneficiarios) => {
      const total = beneficiarios.reduce((sum, b) => sum + b.porcentaje, 0);
      return Math.round(total) === 100;
    }, {
      message: 'La suma de los porcentajes de los beneficiarios debe ser exactamente 100%',
    }),
  tipoRevision: z.enum(['REVISION_ESTANDAR', 'REVISION_EXTENSA']).default('REVISION_ESTANDAR'),
  esManual: z.boolean().default(false),
});

export type BeneficiarioVidaDTO = z.infer<typeof beneficiarioVidaSchema>;
export type CalcularCotizacionVidaDTO = z.infer<typeof calcularCotizacionVidaSchema>;
export type CrearCotizacionVidaDTO = z.infer<typeof crearCotizacionVidaSchema>;
