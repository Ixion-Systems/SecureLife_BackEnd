import { z } from 'zod';

export const requestAssistanceSchema = z.object({
  policyId: z.string().uuid({ message: 'El ID de la póliza debe ser un UUID válido' }),
  tipoAsistencia: z.string().min(1, { message: 'El tipo de asistencia es obligatorio' }),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
  direccion: z.string().optional(),
});

export type RequestAssistanceDTO = z.infer<typeof requestAssistanceSchema>;
