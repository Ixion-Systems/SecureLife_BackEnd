import { cotizadorRepository, CotizadorRepository, CotizacionAutoInput } from './cotizador.repository';
import { cotizadorSyncService, CotizadorSyncService } from './cotizador.sync.service';

export class CotizadorService {
  constructor(
    private readonly repository: CotizadorRepository = cotizadorRepository,
    private readonly syncService: CotizadorSyncService = cotizadorSyncService
  ) {}

  /**
   * Obtiene la lista oficial de marcas registradas en la base de datos
   */
  async getMarcas() {
    return this.repository.getMarcas();
  }

  /**
   * Obtiene los modelos de una marca con sus años tasados
   */
  async getModelos(marcaCodigo: string) {
    const raw = await this.repository.getModelos(marcaCodigo);

    return raw.map((m) => ({
      id: m.id,
      codigo: m.codigo,
      nombre: m.nombre,
      segmento: m.segmento,
      aniosDisponibles: m.valuaciones.map((v) => ({
        anio: v.anio,
        sumaAsegurada: Number(v.sumaAsegurada),
      })),
    }));
  }

  /**
   * Calcula la cotización actuarial ejecutando el Stored Procedure en PostgreSQL
   */
  async calcularCotizacion(input: CotizacionAutoInput) {
    const raw = await this.repository.calcularCotizacion(input);

    if (!raw) {
      throw new Error('No se pudo calcular la cotización para el vehículo especificado.');
    }

    return {
      sumaAsegurada: Number(raw.suma_asegurada),
      tasaPura: Number(raw.tasa_pura),
      factorPostal: Number(raw.factor_postal),
      primaMensualEstimada: Number(raw.prima_mensual_estimada),
      franquicia: Number(raw.franquicia),
      desglose: {
        premioBase: Number(raw.premio_base_mensual),
        recargoGnc: Number(raw.recargo_gnc_mensual),
        ajusteKilometraje: Number(raw.ajuste_km_mensual),
        impuestos: Number(raw.impuestos_mensuales),
      },
    };
  }

  /**
   * Fuerza una sincronización manual del catálogo
   */
  async syncCatalogo() {
    return this.syncService.syncValuaciones(true);
  }

  /**
   * Consulta el estado de la última sincronización
   */
  async getSyncStatus() {
    const lastLog = await this.repository.getLastSyncLog();
    const totalValuaciones = await this.repository.countValuaciones();

    return {
      totalValuaciones,
      lastSync: lastLog
        ? {
            fuente: lastLog.fuente,
            registrosAfectados: lastLog.registrosAfectados,
            estado: lastLog.estado,
            detalle: lastLog.detalle,
            fecha: lastLog.createdAt,
          }
        : null,
    };
  }
}

export const cotizadorService = new CotizadorService();
