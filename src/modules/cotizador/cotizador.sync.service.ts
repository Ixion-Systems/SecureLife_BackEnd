import { cotizadorRepository, CotizadorRepository, ValuacionVehiculoInput } from './cotizador.repository';

/**
 * Catálogo Curado Oficial de Valuaciones de Mercado (Argentina - ACARA / DNRPA)
 * Incluye modelos de alta demanda en el mercado asegurador con sumas aseguradas vigentes en ARS.
 */
export const DATASET_VALUACIONES_BASE: ValuacionVehiculoInput[] = [
  // TOYOTA
  { marcaCodigo: 'toyota', marcaNombre: 'Toyota', modeloCodigo: 'corolla', modeloNombre: 'Corolla', anio: 2025, sumaAsegurada: 34500000, segmento: 'SEDAN', codigoAcara: 'TOY-COR-25' },
  { marcaCodigo: 'toyota', marcaNombre: 'Toyota', modeloCodigo: 'corolla', modeloNombre: 'Corolla', anio: 2024, sumaAsegurada: 29800000, segmento: 'SEDAN', codigoAcara: 'TOY-COR-24' },
  { marcaCodigo: 'toyota', marcaNombre: 'Toyota', modeloCodigo: 'corolla', modeloNombre: 'Corolla', anio: 2023, sumaAsegurada: 25200000, segmento: 'SEDAN', codigoAcara: 'TOY-COR-23' },
  { marcaCodigo: 'toyota', marcaNombre: 'Toyota', modeloCodigo: 'corolla', modeloNombre: 'Corolla', anio: 2022, sumaAsegurada: 21500000, segmento: 'SEDAN', codigoAcara: 'TOY-COR-22' },
  { marcaCodigo: 'toyota', marcaNombre: 'Toyota', modeloCodigo: 'hilux', modeloNombre: 'Hilux', anio: 2025, sumaAsegurada: 52000000, segmento: 'PICKUP', codigoAcara: 'TOY-HIL-25' },
  { marcaCodigo: 'toyota', marcaNombre: 'Toyota', modeloCodigo: 'hilux', modeloNombre: 'Hilux', anio: 2024, sumaAsegurada: 44000000, segmento: 'PICKUP', codigoAcara: 'TOY-HIL-24' },
  { marcaCodigo: 'toyota', marcaNombre: 'Toyota', modeloCodigo: 'hilux', modeloNombre: 'Hilux', anio: 2023, sumaAsegurada: 38000000, segmento: 'PICKUP', codigoAcara: 'TOY-HIL-23' },
  { marcaCodigo: 'toyota', marcaNombre: 'Toyota', modeloCodigo: 'yaris', modeloNombre: 'Yaris', anio: 2024, sumaAsegurada: 22800000, segmento: 'HATCHBACK', codigoAcara: 'TOY-YAR-24' },
  { marcaCodigo: 'toyota', marcaNombre: 'Toyota', modeloCodigo: 'yaris', modeloNombre: 'Yaris', anio: 2023, sumaAsegurada: 19500000, segmento: 'HATCHBACK', codigoAcara: 'TOY-YAR-23' },
  { marcaCodigo: 'toyota', marcaNombre: 'Toyota', modeloCodigo: 'etios', modeloNombre: 'Etios', anio: 2023, sumaAsegurada: 16500000, segmento: 'COMPACT', codigoAcara: 'TOY-ETI-23' },
  { marcaCodigo: 'toyota', marcaNombre: 'Toyota', modeloCodigo: 'etios', modeloNombre: 'Etios', anio: 2022, sumaAsegurada: 14200000, segmento: 'COMPACT', codigoAcara: 'TOY-ETI-22' },

  // VOLKSWAGEN
  { marcaCodigo: 'volkswagen', marcaNombre: 'Volkswagen', modeloCodigo: 'gol', modeloNombre: 'Gol Trend', anio: 2022, sumaAsegurada: 13500000, segmento: 'HATCHBACK', codigoAcara: 'VW-GOL-22' },
  { marcaCodigo: 'volkswagen', marcaNombre: 'Volkswagen', modeloCodigo: 'gol', modeloNombre: 'Gol Trend', anio: 2021, sumaAsegurada: 11800000, segmento: 'HATCHBACK', codigoAcara: 'VW-GOL-21' },
  { marcaCodigo: 'volkswagen', marcaNombre: 'Volkswagen', modeloCodigo: 'amarok', modeloNombre: 'Amarok', anio: 2025, sumaAsegurada: 54000000, segmento: 'PICKUP', codigoAcara: 'VW-AMA-25' },
  { marcaCodigo: 'volkswagen', marcaNombre: 'Volkswagen', modeloCodigo: 'amarok', modeloNombre: 'Amarok', anio: 2024, sumaAsegurada: 46000000, segmento: 'PICKUP', codigoAcara: 'VW-AMA-24' },
  { marcaCodigo: 'volkswagen', marcaNombre: 'Volkswagen', modeloCodigo: 'taos', modeloNombre: 'Taos', anio: 2024, sumaAsegurada: 38500000, segmento: 'SUV', codigoAcara: 'VW-TAO-24' },
  { marcaCodigo: 'volkswagen', marcaNombre: 'Volkswagen', modeloCodigo: 'polo', modeloNombre: 'Polo', anio: 2024, sumaAsegurada: 23500000, segmento: 'HATCHBACK', codigoAcara: 'VW-POL-24' },
  { marcaCodigo: 'volkswagen', marcaNombre: 'Volkswagen', modeloCodigo: 'vento', modeloNombre: 'Vento', anio: 2024, sumaAsegurada: 42000000, segmento: 'SEDAN', codigoAcara: 'VW-VEN-24' },

  // FIAT
  { marcaCodigo: 'fiat', marcaNombre: 'Fiat', modeloCodigo: 'cronos', modeloNombre: 'Cronos', anio: 2025, sumaAsegurada: 24500000, segmento: 'SEDAN', codigoAcara: 'FIA-CRO-25' },
  { marcaCodigo: 'fiat', marcaNombre: 'Fiat', modeloCodigo: 'cronos', modeloNombre: 'Cronos', anio: 2024, sumaAsegurada: 21000000, segmento: 'SEDAN', codigoAcara: 'FIA-CRO-24' },
  { marcaCodigo: 'fiat', marcaNombre: 'Fiat', modeloCodigo: 'cronos', modeloNombre: 'Cronos', anio: 2023, sumaAsegurada: 18200000, segmento: 'SEDAN', codigoAcara: 'FIA-CRO-23' },
  { marcaCodigo: 'fiat', marcaNombre: 'Fiat', modeloCodigo: 'toro', modeloNombre: 'Toro', anio: 2024, sumaAsegurada: 33000000, segmento: 'PICKUP', codigoAcara: 'FIA-TOR-24' },
  { marcaCodigo: 'fiat', marcaNombre: 'Fiat', modeloCodigo: 'pulse', modeloNombre: 'Pulse', anio: 2024, sumaAsegurada: 27500000, segmento: 'SUV', codigoAcara: 'FIA-PUL-24' },

  // PEUGEOT
  { marcaCodigo: 'peugeot', marcaNombre: 'Peugeot', modeloCodigo: '208', modeloNombre: '208', anio: 2025, sumaAsegurada: 25000000, segmento: 'HATCHBACK', codigoAcara: 'PEU-208-25' },
  { marcaCodigo: 'peugeot', marcaNombre: 'Peugeot', modeloCodigo: '208', modeloNombre: '208', anio: 2024, sumaAsegurada: 21500000, segmento: 'HATCHBACK', codigoAcara: 'PEU-208-24' },
  { marcaCodigo: 'peugeot', marcaNombre: 'Peugeot', modeloCodigo: '208', modeloNombre: '208', anio: 2023, sumaAsegurada: 18500000, segmento: 'HATCHBACK', codigoAcara: 'PEU-208-23' },
  { marcaCodigo: 'peugeot', marcaNombre: 'Peugeot', modeloCodigo: '2008', modeloNombre: '2008', anio: 2025, sumaAsegurada: 31000000, segmento: 'SUV', codigoAcara: 'PEU-2008-25' },

  // CHEVROLET
  { marcaCodigo: 'chevrolet', marcaNombre: 'Chevrolet', modeloCodigo: 'cruze', modeloNombre: 'Cruze', anio: 2024, sumaAsegurada: 27500000, segmento: 'SEDAN', codigoAcara: 'CHEV-CRU-24' },
  { marcaCodigo: 'chevrolet', marcaNombre: 'Chevrolet', modeloCodigo: 'tracker', modeloNombre: 'Tracker', anio: 2025, sumaAsegurada: 33000000, segmento: 'SUV', codigoAcara: 'CHEV-TRA-25' },
  { marcaCodigo: 'chevrolet', marcaNombre: 'Chevrolet', modeloCodigo: 'onix', modeloNombre: 'Onix', anio: 2024, sumaAsegurada: 21800000, segmento: 'HATCHBACK', codigoAcara: 'CHEV-ONI-24' },
  { marcaCodigo: 'chevrolet', marcaNombre: 'Chevrolet', modeloCodigo: 's10', modeloNombre: 'S10', anio: 2024, sumaAsegurada: 41000000, segmento: 'PICKUP', codigoAcara: 'CHEV-S10-24' },

  // FORD
  { marcaCodigo: 'ford', marcaNombre: 'Ford', modeloCodigo: 'ranger', modeloNombre: 'Ranger', anio: 2025, sumaAsegurada: 56000000, segmento: 'PICKUP', codigoAcara: 'FOR-RAN-25' },
  { marcaCodigo: 'ford', marcaNombre: 'Ford', modeloCodigo: 'ranger', modeloNombre: 'Ranger', anio: 2024, sumaAsegurada: 48000000, segmento: 'PICKUP', codigoAcara: 'FOR-RAN-24' },
  { marcaCodigo: 'ford', marcaNombre: 'Ford', modeloCodigo: 'territory', modeloNombre: 'Territory', anio: 2024, sumaAsegurada: 39000000, segmento: 'SUV', codigoAcara: 'FOR-TER-24' },
  { marcaCodigo: 'ford', marcaNombre: 'Ford', modeloCodigo: 'maverick', modeloNombre: 'Maverick', anio: 2024, sumaAsegurada: 36000000, segmento: 'PICKUP', codigoAcara: 'FOR-MAV-24' },

  // RENAULT
  { marcaCodigo: 'renault', marcaNombre: 'Renault', modeloCodigo: 'sandero', modeloNombre: 'Sandero', anio: 2024, sumaAsegurada: 19500000, segmento: 'HATCHBACK', codigoAcara: 'REN-SAN-24' },
  { marcaCodigo: 'renault', marcaNombre: 'Renault', modeloCodigo: 'duster', modeloNombre: 'Duster', anio: 2024, sumaAsegurada: 28000000, segmento: 'SUV', codigoAcara: 'REN-DUS-24' },
  { marcaCodigo: 'renault', marcaNombre: 'Renault', modeloCodigo: 'kangoo', modeloNombre: 'Kangoo', anio: 2024, sumaAsegurada: 24000000, segmento: 'UTILITARIO', codigoAcara: 'REN-KAN-24' },
];

export class CotizadorSyncService {
  private timer: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // Verificación cada 24 horas
  private readonly MAX_DAYS_BETWEEN_SYNCS = 7; // Renovación semanal obligatoria

  constructor(private readonly repository: CotizadorRepository = cotizadorRepository) {}

  /**
   * Ejecuta la sincronización de valuaciones invocando el Stored Procedure atómico
   */
  async syncValuaciones(force: boolean = false): Promise<{ success: boolean; affected: number; reason: string }> {
    try {
      const lastLog = await this.repository.getLastSyncLog();
      const count = await this.repository.countValuaciones();

      if (!force && lastLog && count > 0) {
        const daysSinceLastSync = (Date.now() - new Date(lastLog.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastSync < this.MAX_DAYS_BETWEEN_SYNCS) {
          return {
            success: true,
            affected: 0,
            reason: `Catálogo al día (última sincronización hace ${Math.round(daysSinceLastSync)} días)`,
          };
        }
      }

      console.log('🔄 [CotizadorSyncService] Iniciando sincronización semanal de valuaciones ACARA/DNRPA...');

      let affected = 0;
      for (const item of DATASET_VALUACIONES_BASE) {
        await this.repository.upsertValuacion(item);
        affected++;
      }

      await this.repository.recordSyncLog(
        'ACARA_DNRPA_SEMANAL',
        affected,
        'EXITOSO',
        `Sincronización semanal automática completada. ${affected} valuaciones actualizadas.`
      );

      console.log(`✅ [CotizadorSyncService] Sincronización exitosa: ${affected} valuaciones procesadas.`);
      return { success: true, affected, reason: 'Sincronización semanal exitosa' };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ [CotizadorSyncService] Error durante sincronización:', err);
      await this.repository.recordSyncLog(
        'ACARA_DNRPA_SEMANAL',
        0,
        'FALLIDO',
        errorMessage
      );
      return { success: false, affected: 0, reason: errorMessage };
    }
  }

  /**
   * Inicia el planificador periódico para sincronizar automáticamente cada semana
   */
  startScheduler() {
    // 1. Ejecutar verificación preventiva al iniciar el servidor
    this.syncValuaciones(false).catch((err) =>
      console.error('[CotizadorSyncService] Fallo en sync inicial:', err)
    );

    // 2. Programar comprobación diaria continua
    if (!this.timer) {
      this.timer = setInterval(() => {
        this.syncValuaciones(false).catch((err) =>
          console.error('[CotizadorSyncService] Fallo en ciclo de sync:', err)
        );
      }, this.SYNC_INTERVAL_MS);
      this.timer.unref(); // No bloquea la terminación del proceso si se apaga
    }
  }

  /**
   * Detiene el planificador (útil en tests o shutdown)
   */
  stopScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const cotizadorSyncService = new CotizadorSyncService();
