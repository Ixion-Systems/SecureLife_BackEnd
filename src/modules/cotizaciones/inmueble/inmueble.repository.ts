import { PrismaClient } from '@prisma/client';
import { prisma } from '../../../config/database';
import {
  CalcularCotizacionInmuebleDTO,
  CrearCotizacionInmuebleDTO,
} from './inmueble.schema';

export interface CalculoInmuebleSPRow {
  suma_edificio: number | string;
  suma_contenido: number | string;
  suma_electrodomesticos: number | string;
  rc_linderos: number | string;
  suma_asegurada_total: number | string;
  prima_edificio_mensual: number | string;
  prima_contenido_mensual: number | string;
  prima_electro_mensual: number | string;
  prima_rc_mensual: number | string;
  descuento_seguridad_mensual: number | string;
  recargo_techo_mensual: number | string;
  premio_base_mensual: number | string;
  impuestos_mensuales: number | string;
  prima_mensual_estimada: number | string;
}

export interface CotizacionInmuebleSPRow {
  cotizacion_id: string;
  numero_cotizacion: string;
  user_id: string | null;
  ramo: string;
  estado: string;
  tipo_revision: string;
  es_manual: boolean;
  suma_asegurada: number | string;
  prima_estimada: number | string;
  datos_riesgo: Record<string, unknown>;
  documentos_adjuntos: string[];
  created_at: Date;
}

export class CotizacionInmuebleRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  /**
   * Invoca el procedimiento almacenado actuarial de cálculo de prima para inmuebles
   */
  async calcularCotizacion(input: CalcularCotizacionInmuebleDTO): Promise<CalculoInmuebleSPRow | null> {
    const rows = await this.db.$queryRaw<CalculoInmuebleSPRow[]>`
      SELECT * FROM sp_calcular_cotizacion_inmueble(
        ${input.tipoInmueble}::text,
        ${input.superficieM2}::numeric,
        ${input.codigoPostal || '1001'}::text,
        ${input.tipoTecho || 'LOSA'}::text,
        ${Boolean(input.tieneAlarma)}::boolean,
        ${Boolean(input.tieneRejas)}::boolean,
        ${input.sumaEdificio ?? 0}::numeric,
        ${input.sumaContenido ?? 0}::numeric,
        ${input.sumaElectrodomesticos ?? 0}::numeric,
        ${input.rcLinderos ?? 0}::numeric
      );
    `;

    return rows[0] || null;
  }

  /**
   * Invoca el procedimiento almacenado de creación de cotización oficial de inmuebles
   */
  async crearCotizacion(
    userId: string | null,
    input: CrearCotizacionInmuebleDTO,
    datosRiesgoJson: string,
    documentosJson: string
  ): Promise<CotizacionInmuebleSPRow | null> {
    const rows = await this.db.$queryRaw<CotizacionInmuebleSPRow[]>`
      SELECT * FROM sp_crear_cotizacion_inmueble(
        ${userId}::uuid,
        ${input.tipoInmueble}::text,
        ${input.superficieM2}::numeric,
        ${input.codigoPostal}::text,
        ${input.tipoTecho || 'LOSA'}::text,
        ${Boolean(input.tieneAlarma)}::boolean,
        ${Boolean(input.tieneRejas)}::boolean,
        ${input.sumaEdificio ?? 0}::numeric,
        ${input.sumaContenido ?? 0}::numeric,
        ${input.sumaElectrodomesticos ?? 0}::numeric,
        ${input.rcLinderos ?? 0}::numeric,
        ${datosRiesgoJson}::jsonb,
        ${documentosJson}::jsonb,
        ${input.tipoRevision || 'REVISION_ESTANDAR'}::text,
        ${Boolean(input.esManual)}::boolean
      );
    `;

    return rows[0] || null;
  }

  /**
   * Consulta una cotización por su identificador UUID
   */
  async findById(id: string) {
    return this.db.cotizacion.findUnique({
      where: { id },
      include: {
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

export const cotizacionInmuebleRepository = new CotizacionInmuebleRepository();
