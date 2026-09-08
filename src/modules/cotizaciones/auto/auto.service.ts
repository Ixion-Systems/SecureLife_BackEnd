import { autoRepository, AutoRepository } from './auto.repository';
import {
  CrearCotizacionAutoDTO,
  TasarCotizacionDTO,
} from './auto.schema';
import {
  CotizacionAutoResponse,
  ResponderPeritajeResponse,
} from './auto.types';
import { AppError, NotFoundError } from '../../../middlewares/error.middleware';

export class AutoService {
  constructor(private readonly repository: AutoRepository = autoRepository) {}

  /**
   * Registra una nueva solicitud de cotización automotor (Catálogo o Revisión Extensa)
   */
  async crearSolicitud(userId: string, dto: CrearCotizacionAutoDTO): Promise<CotizacionAutoResponse> {
    const esManual = Boolean(dto.esManual);
    const tipoRevision = dto.tipoRevision || (esManual ? 'REVISION_EXTENSA' : 'REVISION_ESTANDAR');

    const datosRiesgo = {
      vehiculo: {
        marcaCodigo: dto.marcaCodigo,
        marcaNombre: dto.marcaNombre,
        modeloCodigo: dto.modeloCodigo,
        modeloNombre: dto.modeloNombre,
        anio: dto.anio,
        patente: dto.patente,
        tieneGnc: dto.tieneGnc,
        kilometrajeAnual: dto.kilometrajeAnual,
        codigoPostal: dto.codigoPostal,
        planCobertura: dto.planCobertura,
      },
      ...(dto.datosRiesgo || {}),
    };

    const row = await this.repository.crearCotizacionAutomotor({
      userId,
      esManual,
      tipoRevision,
      marcaCodigo: dto.marcaCodigo,
      marcaNombre: dto.marcaNombre,
      modeloCodigo: dto.modeloCodigo,
      modeloNombre: dto.modeloNombre,
      anio: dto.anio,
      patente: dto.patente,
      codigoPostal: dto.codigoPostal || '1001',
      planCobertura: dto.planCobertura || 'TODO_RIESGO',
      tieneGnc: Boolean(dto.tieneGnc),
      kilometrajeAnual: dto.kilometrajeAnual || 15000,
      valorDeclarado: dto.valorDeclarado,
      datosRiesgo,
      documentosAdjuntos: dto.documentosAdjuntos || [],
    });

    if (!row) {
      throw new AppError('No se pudo registrar la cotización automotor', 500);
    }

    return {
      id: row.cotizacion_id,
      numeroCotizacion: row.numero_cotizacion,
      userId: row.user_id,
      ramo: row.ramo,
      estado: row.estado,
      tipoRevision: row.tipo_revision,
      esManual: row.es_manual,
      sumaAsegurada: Number(row.suma_asegurada),
      primaEstimada: Number(row.prima_estimada),
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  /**
   * Obtiene el listado de cotizaciones del usuario autenticado
   */
  async getMisCotizaciones(userId: string) {
    const cotizaciones = await this.repository.getMisCotizaciones(userId);

    return cotizaciones.map((c) => ({
      id: c.id,
      numeroCotizacion: c.numeroCotizacion,
      ramo: c.ramo,
      estado: c.estado,
      tipoRevision: c.tipoRevision,
      esManual: c.esManual,
      sumaAsegurada: Number(c.sumaAsegurada),
      primaEstimada: Number(c.primaEstimada),
      datosRiesgo: c.datosRiesgo,
      documentosAdjuntos: c.documentosAdjuntos,
      observacionesPerito: c.observacionesPerito,
      fechaRespuesta: c.fechaRespuesta ? c.fechaRespuesta.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  /**
   * Lista cotizaciones pendientes para peritos y analistas
   */
  async getPendientesAdmin(tipoRevision?: string) {
    const cotizaciones = await this.repository.getPendientesAdmin(tipoRevision);

    return cotizaciones.map((c) => ({
      id: c.id,
      numeroCotizacion: c.numeroCotizacion,
      ramo: c.ramo,
      estado: c.estado,
      tipoRevision: c.tipoRevision,
      esManual: c.esManual,
      sumaAsegurada: Number(c.sumaAsegurada),
      primaEstimada: Number(c.primaEstimada),
      datosRiesgo: c.datosRiesgo,
      documentosAdjuntos: c.documentosAdjuntos,
      observacionesPerito: c.observacionesPerito,
      peritoAsignadoId: c.peritoAsignadoId,
      fechaRespuesta: c.fechaRespuesta ? c.fechaRespuesta.toISOString() : null,
      cliente: c.user
        ? {
            id: c.user.id,
            email: c.user.email,
            nombre: c.user.profile ? `${c.user.profile.firstName} ${c.user.profile.lastName}` : null,
            dni: c.user.profile?.dni || null,
            telefono: c.user.profile?.phone || null,
          }
        : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  /**
   * Registra la tasación y respuesta de peritaje para una cotización
   */
  async tasarCotizacion(
    cotizacionId: string,
    peritoId: string,
    dto: TasarCotizacionDTO
  ): Promise<ResponderPeritajeResponse> {
    const row = await this.repository.responderCotizacionPeritaje({
      cotizacionId,
      peritoId,
      nuevoEstado: dto.nuevoEstado,
      primaTasada: dto.primaTasada,
      sumaTasada: dto.sumaTasada,
      observaciones: dto.observaciones,
    });

    if (!row) {
      throw new NotFoundError(`No se encontró la cotización con ID: ${cotizacionId}`);
    }

    return {
      cotizacionId: row.cotizacion_id,
      numeroCotizacion: row.numero_cotizacion,
      estado: row.estado,
      primaEstimada: Number(row.prima_estimada),
      sumaAsegurada: Number(row.suma_asegurada),
      fechaRespuesta: new Date(row.fecha_respuesta).toISOString(),
    };
  }
}

export const autoService = new AutoService();
