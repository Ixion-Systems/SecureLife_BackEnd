import {
  cotizacionVidaRepository,
  CotizacionVidaRepository,
} from './vida.repository';
import {
  CalcularCotizacionVidaDTO,
  CrearCotizacionVidaDTO,
} from './vida.schema';
import { BadRequestError } from '../../../middlewares/error.middleware';

export class CotizacionVidaService {
  constructor(
    private readonly repo: CotizacionVidaRepository = cotizacionVidaRepository
  ) {}

  async calcularCotizacion(dto: CalcularCotizacionVidaDTO) {
    const calculo = await this.repo.calcularCotizacion(dto);

    if (!calculo) {
      throw new BadRequestError('No se pudo calcular la prima de seguro de vida con los parámetros enviados');
    }

    return {
      capitalAsegurado: Number(calculo.capital_asegurado),
      tasaBase: Number(calculo.tasa_base),
      factorEdad: Number(calculo.factor_edad),
      recargoFumador: Number(calculo.recargo_fumador),
      recargoDeportes: Number(calculo.recargo_deportes),
      recargoEnfermedades: Number(calculo.recargo_enfermedades),
      recargoOcupacional: Number(calculo.recargo_ocupacional),
      primaAnualPura: Number(calculo.prima_anual_pura),
      primaMensualEstimada: Number(calculo.prima_mensual_estimada),
    };
  }

  async crearCotizacion(userId: string | null, dto: CrearCotizacionVidaDTO) {
    const creada = await this.repo.crearCotizacion(userId, dto);

    if (!creada) {
      throw new BadRequestError('Error al emitir y persistir la cotización de seguro de vida');
    }

    return {
      cotizacionId: creada.cotizacion_id,
      numeroCotizacion: creada.numero_cotizacion,
      ramo: creada.ramo,
      estado: creada.estado,
      tipoRevision: creada.tipo_revision,
      esManual: creada.es_manual,
      capitalAsegurado: Number(creada.capital_asegurado),
      primaEstimada: Number(creada.prima_estimada),
      beneficiarios: creada.beneficiarios,
      createdAt: creada.created_at,
    };
  }

  async obtenerPorId(id: string) {
    return this.repo.findById(id);
  }
}

export const cotizacionVidaService = new CotizacionVidaService();
