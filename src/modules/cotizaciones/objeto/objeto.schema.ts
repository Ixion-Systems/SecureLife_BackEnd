import { z } from 'zod';

export const tipoObjetoPersonalEnum = z.enum([
  'SMARTPHONE',
  'NOTEBOOK_LAPTOP',
  'CAMARA_FOTOGRAFICA',
  'BICICLETA_MOVILIDAD',
]);

export const calcularCotizacionObjetoSchema = z.object({
  tipoObjeto: tipoObjetoPersonalEnum,
  valorReposicion: z.number().min(20000, 'El valor de reposición mínimo es $20.000'),
  coberturaTipo: z.string().default('TODO_RIESGO'),
  franquicia: z.number().min(0, 'La franquicia no puede ser negativa').default(0),
});

export const crearCotizacionObjetoSchema = calcularCotizacionObjetoSchema.extend({
  marca: z.string().min(2, 'La marca es requerida'),
  modelo: z.string().min(2, 'El modelo es requerido'),
  imeiSerie: z.string().min(3, 'El IMEI o número de serie es requerido'),
  imagenesUrls: z.array(z.string()).default([]),
  facturaUrl: z.string().nullable().optional(),
  tipoRevision: z.enum(['REVISION_ESTANDAR', 'REVISION_EXTENSA']).default('REVISION_ESTANDAR'),
  esManual: z.boolean().default(false),
});

export type TipoObjetoPersonal = z.infer<typeof tipoObjetoPersonalEnum>;
export type CalcularCotizacionObjetoDTO = z.infer<typeof calcularCotizacionObjetoSchema>;
export type CrearCotizacionObjetoDTO = z.infer<typeof crearCotizacionObjetoSchema>;
