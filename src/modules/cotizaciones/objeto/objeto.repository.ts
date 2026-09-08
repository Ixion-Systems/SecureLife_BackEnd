import { PrismaClient } from '@prisma/client';
import { prisma } from '../../../config/database';
import {
  CalcularCotizacionObjetoDTO,
  CrearCotizacionObjetoDTO,
} from './objeto.schema';

export interface CalculoObjetoSPRow {
  tipo_objeto: string;
  valor_reposicion: number | string;
  tasa_anual: number | string;
  cobertura_tipo: string;
  franquicia: number | string;
  descuento_franquicia: number | string;
  prima_anual: number | string;
  prima_mensual_estimada: number | string;
}

export interface CotizacionObjetoSPRow {
  cotizacion_id: string;
  numero_cotizacion: string;
  user_id: string | null;
  ramo: string;
  estado: string;
  tipo_revision: string;
  es_manual: boolean;
  valor_reposicion: number | string;
  prima_estimada: number | string;
  created_at: Date;
}

export class CotizacionObjetoRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  /**
   * Invoca el procedimiento almacenado actuarial para cálculo de seguro de objetos personales
   */
  async calcularCotizacion(input: CalcularCotizacionObjetoDTO): Promise<CalculoObjetoSPRow | null> {
    const rows = await this.db.$queryRaw<CalculoObjetoSPRow[]>`
      SELECT * FROM sp_calcular_cotizacion_objeto(
        ${input.tipoObjeto}::text,
        ${input.valorReposicion}::numeric,
        ${input.coberturaTipo || 'TODO_RIESGO'}::text,
        ${input.franquicia ?? 0}::numeric
      );
    `;

    return rows[0] || null;
  }

  /**
   * Invoca el procedimiento almacenado que crea atómicamente la cotización en cotizaciones y cotizaciones_objeto_personal
   */
  async crearCotizacion(
    userId: string | null,
    input: CrearCotizacionObjetoDTO
  ): Promise<CotizacionObjetoSPRow | null> {
    const imagenesJson = JSON.stringify(input.imagenesUrls || []);

    const rows = await this.db.$queryRaw<CotizacionObjetoSPRow[]>`
      SELECT * FROM sp_crear_cotizacion_objeto(
        ${userId}::uuid,
        ${input.tipoObjeto}::text,
        ${input.marca}::text,
        ${input.modelo}::text,
        ${input.imeiSerie}::text,
        ${input.valorReposicion}::numeric,
        ${input.coberturaTipo || 'TODO_RIESGO'}::text,
        ${input.franquicia ?? 0}::numeric,
        ${imagenesJson}::jsonb,
        ${input.facturaUrl || null}::text,
        ${input.tipoRevision || 'REVISION_ESTANDAR'}::text,
        ${Boolean(input.esManual)}::boolean
      );
    `;

    return rows[0] || null;
  }

  /**
   * Buscar cotización de objeto personal con sus relaciones
   */
  async findById(id: string) {
    return this.db.cotizacion.findUnique({
      where: { id },
      include: {
        cotizacionObjetoPersonal: true,
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

export const cotizacionObjetoRepository = new CotizacionObjetoRepository();
