import { z } from 'zod';

export const conductorAdicionalSchema = z.object({
  nombreCompleto: z
    .string({ required_error: 'El nombre completo del conductor es obligatorio' })
    .min(3, 'El nombre del conductor adicional debe tener al menos 3 caracteres')
    .trim(),
  parentesco: z
    .string({ required_error: 'El parentesco es obligatorio' })
    .min(2, 'El parentesco debe ser especificado')
    .trim(),
  edad: z
    .number({ required_error: 'La edad del conductor es obligatoria' })
    .int('La edad debe ser un número entero')
    .min(17, 'El conductor adicional debe tener al menos 17 años')
    .max(100, 'Edad no válida para conducción'),
});

export const titularSchema = z.object({
  nombreCompleto: z
    .string({ required_error: 'El nombre completo del titular es obligatorio' })
    .min(3, 'El nombre completo debe tener al menos 3 caracteres')
    .trim(),
  dni: z
    .string({ required_error: 'El DNI del titular es obligatorio' })
    .regex(/^\d{7,8}$/, 'El DNI debe contener 7 u 8 dígitos numéricos')
    .trim(),
  email: z
    .string({ required_error: 'El email del titular es obligatorio' })
    .email('El correo electrónico no tiene un formato válido')
    .trim()
    .toLowerCase(),
  telefono: z
    .string({ required_error: 'El teléfono del titular es obligatorio' })
    .min(8, 'El número de teléfono debe tener al menos 8 dígitos')
    .trim(),
});

export const vehiculoSchema = z.object({
  patente: z
    .string({ required_error: 'La patente es obligatoria' })
    .min(6, 'La patente debe tener al menos 6 caracteres')
    .max(9, 'La patente no puede superar 9 caracteres')
    .trim()
    .toUpperCase(),
  marca: z
    .string({ required_error: 'La marca es obligatoria' })
    .min(2, 'La marca es obligatoria')
    .trim(),
  modelo: z
    .string({ required_error: 'El modelo es obligatorio' })
    .min(2, 'El modelo es obligatorio')
    .trim(),
  anio: z
    .number({ required_error: 'El año del vehículo es obligatorio' })
    .int('El año debe ser un número entero')
    .min(1990, 'El vehículo debe ser modelo 1990 o posterior')
    .max(new Date().getFullYear() + 1, 'El año no puede ser superior al año próximo'),
  tieneGnc: z.boolean({ required_error: 'Debe especificar si posee GNC' }),
  kilometrajePromedioAnual: z
    .number({ required_error: 'El kilometraje promedio anual es obligatorio' })
    .positive('El kilometraje debe ser mayor a 0'),
});

export const cotizacionAutoSchema = z.object({
  titular: titularSchema,
  vehiculo: vehiculoSchema,
  coberturaSolicitada: z.enum(
    ['RESPONSABILIDAD_CIVIL', 'TERCEROS_COMPLETO', 'TODO_RIESGO_CON_FRANQUICIA'],
    {
      required_error: 'La cobertura solicitada es obligatoria',
      invalid_type_error: 'Tipo de cobertura no válida',
    }
  ),
  conductoresAdicionales: z.array(conductorAdicionalSchema).optional(),
});

export type CotizacionAutoDTO = z.infer<typeof cotizacionAutoSchema>;
export type CoberturaTipo = CotizacionAutoDTO['coberturaSolicitada'];
export type TitularDTO = CotizacionAutoDTO['titular'];
export type VehiculoDTO = CotizacionAutoDTO['vehiculo'];
export type ConductorAdicionalDTO = NonNullable<CotizacionAutoDTO['conductoresAdicionales']>[number];
