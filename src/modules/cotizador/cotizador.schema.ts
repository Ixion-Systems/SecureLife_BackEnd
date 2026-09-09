import { z } from 'zod';

export const calcularSimulacionSchema = z.object({
  marcaCodigo: z.string().min(1, { message: 'El código de marca es obligatorio' }),
  modeloCodigo: z.string().min(1, { message: 'El código de modelo es obligatorio' }),
  anio: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1, {
    message: 'El año de fabricación es inválido',
  }),
  codigoPostal: z.string().optional().default('1001'),
  planCobertura: z
    .enum(['RESPONSABILIDAD_CIVIL', 'TERCEROS_BASICO', 'TERCEROS_COMPLETO', 'TODO_RIESGO'])
    .optional()
    .default('TODO_RIESGO'),
  tieneGnc: z.boolean().optional().default(false),
  ajusteKm: z.coerce.number().int().positive().optional().default(15000),
});

export type CalcularSimulacionDTO = z.infer<typeof calcularSimulacionSchema>;
