import { PrismaClient } from '@prisma/client';
import { prisma } from '../../config/database';

export interface CotizacionAutoInput {
  marcaCodigo: string;
  modeloCodigo: string;
  anio: number;
  codigoPostal?: string;
  planCobertura?: string;
  tieneGnc?: boolean;
  ajusteKm?: number;
}

export interface ValuacionVehiculoInput {
  marcaCodigo: string;
  marcaNombre: string;
  modeloCodigo: string;
  modeloNombre: string;
  anio: number;
  sumaAsegurada: number;
  segmento?: string;
  codigoAcara?: string;
}

export interface CalculoAutoSPRow {
  suma_asegurada: number | string;
  tasa_pura: number | string;
  factor_postal: number | string;
  prima_mensual_estimada: number | string;
  franquicia: number | string;
  premio_base_mensual: number | string;
  recargo_gnc_mensual: number | string;
  ajuste_km_mensual: number | string;
  impuestos_mensuales: number | string;
}

export class CotizadorRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  /**
   * Obtiene la lista oficial de marcas activas
   */
  async getMarcas() {
    return this.db.catalogoMarca.findMany({
      where: { activo: true },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        paisOrigen: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * Obtiene los modelos y años tasados de una marca
   */
  async getModelos(marcaCodigo: string) {
    return this.db.catalogoModelo.findMany({
      where: {
        activo: true,
        marca: { codigo: marcaCodigo.toLowerCase() },
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        segmento: true,
        valuaciones: {
          select: {
            anio: true,
            sumaAsegurada: true,
          },
          orderBy: { anio: 'desc' },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * Invoca el Stored Procedure actuarial para calcular la prima en PostgreSQL
   */
  async calcularCotizacion(input: CotizacionAutoInput): Promise<CalculoAutoSPRow | null> {
    const rows = await this.db.$queryRaw<CalculoAutoSPRow[]>`
      SELECT * FROM sp_calcular_cotizacion_auto(
        ${input.marcaCodigo}::text,
        ${input.modeloCodigo}::text,
        ${input.anio}::int,
        ${input.codigoPostal || '1001'}::text,
        ${input.planCobertura || 'TODO_RIESGO'}::text,
        ${Boolean(input.tieneGnc)}::boolean,
        ${input.ajusteKm || 15000}::int
      );
    `;

    return rows[0] || null;
  }

  /**
   * Ejecuta el Stored Procedure atómico de upsert para valuaciones
   */
  async upsertValuacion(input: ValuacionVehiculoInput) {
    await this.db.$executeRaw`
      SELECT sp_upsert_valuacion_vehiculo(
        ${input.marcaCodigo}::text,
        ${input.marcaNombre}::text,
        ${input.modeloCodigo}::text,
        ${input.modeloNombre}::text,
        ${input.anio}::int,
        ${input.sumaAsegurada}::numeric,
        ${input.segmento || 'SEDAN'}::text,
        ${input.codigoAcara || null}::text
      );
    `;
  }

  /**
   * Registra un log de auditoría del worker de sincronización
   */
  async recordSyncLog(fuente: string, registrosAfectados: number, estado: string, detalle?: string) {
    return this.db.cotizacionSyncLog.create({
      data: {
        fuente,
        registrosAfectados,
        estado,
        detalle,
      },
    });
  }

  /**
   * Obtiene el último log de sincronización
   */
  async getLastSyncLog() {
    return this.db.cotizacionSyncLog.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Total de valuaciones registradas
   */
  async countValuaciones() {
    return this.db.catalogoValuacion.count();
  }
}

export const cotizadorRepository = new CotizadorRepository();
