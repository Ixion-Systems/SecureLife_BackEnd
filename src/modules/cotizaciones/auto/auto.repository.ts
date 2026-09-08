import { PrismaClient } from '@prisma/client';
import { prisma } from '../../../config/database';
import {
  CrearCotizacionAutoInput,
  CotizacionAutomotorCreatedRow,
  ResponderPeritajeInput,
  ResponderPeritajeRow,
} from './auto.types';

export class AutoRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  /**
   * Invoca el Stored Procedure sp_crear_cotizacion_automotor en PostgreSQL
   */
  async crearCotizacionAutomotor(input: CrearCotizacionAutoInput): Promise<CotizacionAutomotorCreatedRow | null> {
    const datosRiesgoJson = JSON.stringify(input.datosRiesgo || {});
    const documentosAdjuntosJson = JSON.stringify(input.documentosAdjuntos || []);
    const valorDeclarado =
      input.valorDeclarado !== undefined && input.valorDeclarado !== null ? input.valorDeclarado : null;

    const rows = await this.db.$queryRaw<CotizacionAutomotorCreatedRow[]>`
      SELECT * FROM sp_crear_cotizacion_automotor(
        ${input.userId}::uuid,
        ${Boolean(input.esManual)}::boolean,
        ${input.tipoRevision}::text,
        ${input.marcaCodigo}::text,
        ${input.marcaNombre}::text,
        ${input.modeloCodigo}::text,
        ${input.modeloNombre}::text,
        ${input.anio}::int,
        ${input.patente}::text,
        ${input.codigoPostal || '1001'}::text,
        ${input.planCobertura || 'TODO_RIESGO'}::text,
        ${Boolean(input.tieneGnc)}::boolean,
        ${input.kilometrajeAnual || 15000}::int,
        ${valorDeclarado}::numeric,
        ${datosRiesgoJson}::jsonb,
        ${documentosAdjuntosJson}::jsonb
      );
    `;

    return rows[0] || null;
  }

  /**
   * Invoca el Stored Procedure sp_responder_cotizacion_peritaje en PostgreSQL
   */
  async responderCotizacionPeritaje(input: ResponderPeritajeInput): Promise<ResponderPeritajeRow | null> {
    const rows = await this.db.$queryRaw<ResponderPeritajeRow[]>`
      SELECT * FROM sp_responder_cotizacion_peritaje(
        ${input.cotizacionId}::uuid,
        ${input.peritoId}::uuid,
        ${input.nuevoEstado}::text,
        ${input.primaTasada}::numeric,
        ${input.sumaTasada}::numeric,
        ${input.observaciones}::text
      );
    `;

    return rows[0] || null;
  }

  /**
   * Consulta cotizaciones del usuario autenticado en cotizaciones con orden por fecha descendente
   */
  async getMisCotizaciones(userId: string) {
    return this.db.cotizacion.findMany({
      where: {
        userId,
        ramo: 'AUTOMOTOR',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Lista cotizaciones pendientes para peritos
   */
  async getPendientesAdmin(tipoRevision?: string) {
    const where: { ramo: 'AUTOMOTOR'; estado: { in: string[] }; tipoRevision?: string } = {
      ramo: 'AUTOMOTOR',
      estado: { in: ['PENDIENTE', 'EN_REVISION_EXTENSA'] },
    };

    if (tipoRevision) {
      where.tipoRevision = tipoRevision;
    }

    return this.db.cotizacion.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                dni: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export const autoRepository = new AutoRepository();
