import crypto from 'crypto';
import { CotizacionAutoDTO, CoberturaTipo } from './cotizaciones.schema';

export interface DetalleCalculoActuarial {
  base: number;
  recargoGnc: number;
  bonificacion: number;
  impuestos: number;
}

export interface CotizacionAutoResultado {
  cotizacionId: string;
  id: string;
  cobertura: CoberturaTipo;
  primaMensual: number;
  primaMensualEstimada: number;
  sumaAsegurada: number;
  franquiciaMonto: number;
  franquicia: number | null;
  detalleCalculo: DetalleCalculoActuarial;
  desglose: {
    premioBase: number;
    recargoGnc: number;
    ajusteKilometraje: number;
    recargoConductores: number;
    impuestos: number;
  };
  fechaCalculo: string;
  origen: 'api';
}

interface CoberturaConfig {
  basePrima: number;
  sumaAseguradaBase: number;
  franquicia: number;
}

const TABLA_COBERTURAS: Record<CoberturaTipo, CoberturaConfig> = {
  RESPONSABILIDAD_CIVIL: {
    basePrima: 28000,
    sumaAseguradaBase: 160000000,
    franquicia: 0,
  },
  TERCEROS_COMPLETO: {
    basePrima: 54000,
    sumaAseguradaBase: 26000000,
    franquicia: 0,
  },
  TODO_RIESGO_CON_FRANQUICIA: {
    basePrima: 92000,
    sumaAseguradaBase: 38000000,
    franquicia: 350000,
  },
};

export class CotizacionesService {
  /**
   * Realiza el cálculo actuarial de prima para cotización automotor
   */
  public async cotizarAuto(dto: CotizacionAutoDTO): Promise<CotizacionAutoResultado> {
    const configCobertura = TABLA_COBERTURAS[dto.coberturaSolicitada];
    const anioActual = new Date().getFullYear();
    const antiguedad = Math.max(0, anioActual - dto.vehiculo.anio);

    // 1. Ajuste actuarial por antigüedad del vehículo
    let factorAntiguedad = 1.0;
    if (antiguedad <= 2) {
      factorAntiguedad = 1.1; // Repuestos nuevos / costo de reposición
    } else if (antiguedad <= 7) {
      factorAntiguedad = 1.0; // Riesgo estándar
    } else if (antiguedad <= 15) {
      factorAntiguedad = 1.2; // Desgaste mecánico / disponibilidad repuestos
    } else {
      factorAntiguedad = 1.35; // Alta siniestralidad mecánica
    }

    const baseAjustadaPorAnio = Math.round(configCobertura.basePrima * factorAntiguedad);

    // 2. Ajuste por suma asegurada estimada según depreciación anual (aprox 6% anual para casco)
    const factorDepreciacion = Math.max(0.35, 1 - antiguedad * 0.06);
    const sumaAseguradaCalculada =
      dto.coberturaSolicitada === 'RESPONSABILIDAD_CIVIL'
        ? configCobertura.sumaAseguradaBase
        : Math.round(configCobertura.sumaAseguradaBase * factorDepreciacion);

    // 3. Recargo por GNC (15% obligatorio sobre la base)
    const recargoGnc = dto.vehiculo.tieneGnc
      ? Math.round(baseAjustadaPorAnio * 0.15)
      : 0;

    // 4. Ajuste por kilometraje anual promedio y bonificaciones
    let recargoKilometraje = 0;
    let bonificacion = 0;

    if (dto.vehiculo.kilometrajePromedioAnual < 12000) {
      // Bonificación por bajo kilometraje / uso recreativo
      bonificacion += Math.round(baseAjustadaPorAnio * 0.08);
    } else if (dto.vehiculo.kilometrajePromedioAnual > 25000) {
      // Recargo por alta exposición en vía pública
      recargoKilometraje += Math.round(baseAjustadaPorAnio * 0.12);
    }

    // Recargo por conductores adicionales
    const recargoConductores = (dto.conductoresAdicionales?.length || 0) * Math.round(baseAjustadaPorAnio * 0.07);

    // Bonificación adicional por titular sin conductores jóvenes de riesgo
    const tieneConductoresJovenes = dto.conductoresAdicionales?.some(
      (c) => c.edad < 25
    );
    if (!tieneConductoresJovenes && dto.vehiculo.kilometrajePromedioAnual <= 20000) {
      bonificacion += Math.round(baseAjustadaPorAnio * 0.05);
    }

    // 5. Cálculo de subtotal antes de impuestos
    const ajusteKilometrajeNeto = recargoKilometraje - bonificacion;
    const subtotalPrima = Math.max(
      15000,
      baseAjustadaPorAnio + recargoGnc + ajusteKilometrajeNeto + recargoConductores
    );

    // 6. Impuestos reglamentarios (IVA 21% + Tasas SSN y Sellos ~5%)
    const TASA_IMPUESTOS = 0.26;
    const impuestos = Math.round(subtotalPrima * TASA_IMPUESTOS);
    const primaMensual = subtotalPrima + impuestos;

    const id = crypto.randomUUID();

    return {
      cotizacionId: id,
      id,
      cobertura: dto.coberturaSolicitada,
      primaMensual,
      primaMensualEstimada: primaMensual,
      sumaAsegurada: sumaAseguradaCalculada,
      franquiciaMonto: configCobertura.franquicia,
      franquicia: configCobertura.franquicia > 0 ? configCobertura.franquicia : null,
      detalleCalculo: {
        base: baseAjustadaPorAnio,
        recargoGnc,
        bonificacion,
        impuestos,
      },
      desglose: {
        premioBase: baseAjustadaPorAnio,
        recargoGnc,
        ajusteKilometraje: ajusteKilometrajeNeto,
        recargoConductores,
        impuestos,
      },
      fechaCalculo: new Date().toISOString(),
      origen: 'api',
    };
  }
}
