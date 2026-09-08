import { BadRequestError } from '../../../middlewares/error.middleware';
import {
  CotizacionInmuebleRepository,
  cotizacionInmuebleRepository,
} from './inmueble.repository';
import {
  CalcularCotizacionInmuebleDTO,
  CrearCotizacionInmuebleDTO,
} from './inmueble.schema';

export interface DesgloseTecnicoInmueble {
  primaEdificio: number;
  primaContenido: number;
  primaElectrodomesticos: number;
  primaRcLinderos: number;
  descuentoSeguridad: number;
  recargoTecho: number;
  premioBaseMensual: number;
  impuestosMensuales: number;
}

export interface SumasAseguradasInmueble {
  edificio: number;
  contenido: number;
  electrodomesticos: number;
  rcLinderos: number;
  total: number;
}

export interface CotizacionInmuebleCalculoResponse {
  tipoInmueble: string;
  superficieM2: number;
  codigoPostal: string;
  tipoTecho: string;
  tieneAlarma: boolean;
  tieneRejas: boolean;
  sumasAseguradas: SumasAseguradasInmueble;
  desgloseTecnicoMensual: DesgloseTecnicoInmueble;
  primaMensualEstimada: number;
  fechaCalculo: string;
}

export interface CotizacionInmuebleResponse {
  cotizacionId: string;
  numeroCotizacion: string;
  userId: string | null;
  ramo: string;
  estado: string;
  tipoRevision: string;
  esManual: boolean;
  sumaAsegurada: number;
  primaEstimada: number;
  datosRiesgo: Record<string, unknown>;
  documentosAdjuntos: string[];
  createdAt: string;
}

export class CotizacionInmuebleService {
  constructor(
    private readonly repository: CotizacionInmuebleRepository = cotizacionInmuebleRepository
  ) {}

  /**
   * Ejecuta el cálculo actuarial en tiempo real llamando al Stored Procedure
   */
  public async calcular(
    dto: CalcularCotizacionInmuebleDTO
  ): Promise<CotizacionInmuebleCalculoResponse> {
    const raw = await this.repository.calcularCotizacion(dto);

    if (!raw) {
      throw new BadRequestError('No se pudo calcular la cotización para los parámetros provistos');
    }

    const sumaEdificio = Number(raw.suma_edificio);
    const sumaContenido = Number(raw.suma_contenido);
    const sumaElectrodomesticos = Number(raw.suma_electrodomesticos);
    const rcLinderos = Number(raw.rc_linderos);
    const totalSuma = Number(raw.suma_asegurada_total);

    const desglose: DesgloseTecnicoInmueble = {
      primaEdificio: Number(raw.prima_edificio_mensual),
      primaContenido: Number(raw.prima_contenido_mensual),
      primaElectrodomesticos: Number(raw.prima_electro_mensual),
      primaRcLinderos: Number(raw.prima_rc_mensual),
      descuentoSeguridad: Number(raw.descuento_seguridad_mensual),
      recargoTecho: Number(raw.recargo_techo_mensual),
      premioBaseMensual: Number(raw.premio_base_mensual),
      impuestosMensuales: Number(raw.impuestos_mensuales),
    };

    return {
      tipoInmueble: dto.tipoInmueble,
      superficieM2: dto.superficieM2,
      codigoPostal: dto.codigoPostal,
      tipoTecho: dto.tipoTecho,
      tieneAlarma: dto.tieneAlarma,
      tieneRejas: dto.tieneRejas,
      sumasAseguradas: {
        edificio: sumaEdificio,
        contenido: sumaContenido,
        electrodomesticos: sumaElectrodomesticos,
        rcLinderos,
        total: totalSuma,
      },
      desgloseTecnicoMensual: desglose,
      primaMensualEstimada: Number(raw.prima_mensual_estimada),
      fechaCalculo: new Date().toISOString(),
    };
  }

  /**
   * Crea y persiste atómicamente la cotización de inmueble
   */
  public async crear(
    userId: string | null,
    dto: CrearCotizacionInmuebleDTO
  ): Promise<CotizacionInmuebleResponse> {
    const datosRiesgo = {
      tipoInmueble: dto.tipoInmueble,
      superficieM2: dto.superficieM2,
      codigoPostal: dto.codigoPostal,
      calle: dto.calle,
      numero: dto.numero,
      piso: dto.piso ?? null,
      depto: dto.depto ?? null,
      ciudad: dto.ciudad,
      provincia: dto.provincia,
      anioConstruccion: dto.anioConstruccion ?? null,
      tipoTecho: dto.tipoTecho,
      tieneAlarma: dto.tieneAlarma,
      tieneRejas: dto.tieneRejas,
      sumaEdificio: dto.sumaEdificio,
      sumaContenido: dto.sumaContenido,
      sumaElectrodomesticos: dto.sumaElectrodomesticos,
      rcLinderos: dto.rcLinderos,
      ...dto.datosRiesgoAdicionales,
    };

    const raw = await this.repository.crearCotizacion(
      userId,
      dto,
      JSON.stringify(datosRiesgo),
      JSON.stringify(dto.documentosAdjuntos || [])
    );

    if (!raw) {
      throw new BadRequestError('Error al crear la cotización de inmueble en la base de datos');
    }

    return {
      cotizacionId: raw.cotizacion_id,
      numeroCotizacion: raw.numero_cotizacion,
      userId: raw.user_id,
      ramo: raw.ramo,
      estado: raw.estado,
      tipoRevision: raw.tipo_revision,
      esManual: raw.es_manual,
      sumaAsegurada: Number(raw.suma_asegurada),
      primaEstimada: Number(raw.prima_estimada),
      datosRiesgo: (raw.datos_riesgo as Record<string, unknown>) || {},
      documentosAdjuntos: (raw.documentos_adjuntos as string[]) || [],
      createdAt: new Date(raw.created_at).toISOString(),
    };
  }
}

export const cotizacionInmuebleService = new CotizacionInmuebleService();
