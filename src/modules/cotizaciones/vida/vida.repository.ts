import { PrismaClient } from '@prisma/client';
import { prisma } from '../../../config/database';
import {
  CalcularCotizacionVidaDTO,
  CrearCotizacionVidaDTO,
} from './vida.schema';

export interface CalculoVidaSPRow {
  capital_asegurado: number | string;
  tasa_base: number | string;
  factor_edad: number | string;
  recargo_fumador: number | string;
  recargo_deportes: number | string;
  recargo_enfermedades: number | string;
  recargo_ocupacional: number | string;
  prima_anual_pura: number | string;
  prima_mensual_estimada: number | string;
}

export interface CotizacionVidaSPRow {
  cotizacion_id: string;
  numero_cotizacion: string;
  user_id: string | null;
  ramo: string;
  estado: string;
  tipo_revision: string;
  es_manual: boolean;
  capital_asegurado: number | string;
  prima_estimada: number | string;
  beneficiarios: unknown;
  created_at: Date;
}

export class CotizacionVidaRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  /**
   * Invoca el procedimiento almacenado actuarial para cálculo de seguro de vida
   */
  async calcularCotizacion(input: CalcularCotizacionVidaDTO): Promise<CalculoVidaSPRow | null> {
    const rows = await this.db.$queryRaw<CalculoVidaSPRow[]>`
      SELECT * FROM sp_calcular_cotizacion_vida(
        ${input.edad}::int,
        ${input.genero || 'OTRO'}::text,
        ${input.ocupacion}::text,
        ${input.riesgoOcupacional || 'BAJO'}::text,
        ${Boolean(input.fumador)}::boolean,
        ${Boolean(input.deportesRiesgo)}::boolean,
        ${Boolean(input.enfermedadesPreexistentes)}::boolean,
        ${input.capitalAsegurado}::numeric
      );
    `;

    return rows[0] || null;
  }

  /**
   * Invoca el procedimiento almacenado que crea atómicamente la cotización en cotizaciones y cotizaciones_vida
   */
  async crearCotizacion(
    userId: string | null,
    input: CrearCotizacionVidaDTO
  ): Promise<CotizacionVidaSPRow | null> {
    const beneficiariosJson = JSON.stringify(input.beneficiarios || []);

    const rows = await this.db.$queryRaw<CotizacionVidaSPRow[]>`
      SELECT * FROM sp_crear_cotizacion_vida(
        ${userId}::uuid,
        ${input.edad}::int,
        ${input.genero || 'OTRO'}::text,
        ${input.ocupacion}::text,
        ${input.riesgoOcupacional || 'BAJO'}::text,
        ${Boolean(input.fumador)}::boolean,
        ${Boolean(input.deportesRiesgo)}::boolean,
        ${Boolean(input.enfermedadesPreexistentes)}::boolean,
        ${input.capitalAsegurado}::numeric,
        ${beneficiariosJson}::jsonb,
        ${input.tipoRevision || 'REVISION_ESTANDAR'}::text,
        ${Boolean(input.esManual)}::boolean
      );
    `;

    return rows[0] || null;
  }

  /**
   * Buscar cotización de vida con sus relaciones
   */
  async findById(id: string) {
    return this.db.cotizacion.findUnique({
      where: { id },
      include: {
        cotizacionVida: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });
  }
}

export const cotizacionVidaRepository = new CotizacionVidaRepository();
