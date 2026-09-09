import {
  cotizacionObjetoRepository,
  CotizacionObjetoRepository,
} from './objeto.repository';
import {
  CalcularCotizacionObjetoDTO,
  CrearCotizacionObjetoDTO,
} from './objeto.schema';
import {
  BadRequestError,
  NotFoundError,
} from '../../../middlewares/error.middleware';

export class CotizacionObjetoService {
  constructor(
    private readonly repo: CotizacionObjetoRepository = cotizacionObjetoRepository
  ) {}

  async calcularCotizacion(dto: CalcularCotizacionObjetoDTO) {
    const calculo = await this.repo.calcularCotizacion(dto);

    if (!calculo) {
      throw new BadRequestError('No se pudo calcular la prima de objeto personal con los parámetros enviados');
    }

    return {
      tipoObjeto: calculo.tipo_objeto,
      valorReposicion: Number(calculo.valor_reposicion),
      tasaAnual: Number(calculo.tasa_anual),
      coberturaTipo: calculo.cobertura_tipo,
      franquicia: Number(calculo.franquicia),
      descuentoFranquicia: Number(calculo.descuento_franquicia),
      primaAnual: Number(calculo.prima_anual),
      primaMensualEstimada: Number(calculo.prima_mensual_estimada),
    };
  }

  async crearCotizacion(userId: string | null, dto: CrearCotizacionObjetoDTO) {
    const creada = await this.repo.crearCotizacion(userId, dto);

    if (!creada) {
      throw new BadRequestError('Error al emitir y persistir la cotización de objeto personal');
    }

    return {
      cotizacionId: creada.cotizacion_id,
      numeroCotizacion: creada.numero_cotizacion,
      ramo: creada.ramo,
      estado: creada.estado,
      tipoRevision: creada.tipo_revision,
      esManual: creada.es_manual,
      valorReposicion: Number(creada.valor_reposicion),
      primaEstimada: Number(creada.prima_estimada),
      createdAt: creada.created_at,
    };
  }

  async obtenerPorId(id: string) {
    const cotizacion = await this.repo.findById(id);
    if (!cotizacion) {
      throw new NotFoundError(`No se encontró la cotización de objeto personal con ID: ${id}`);
    }
    return cotizacion;
  }
}

export const cotizacionObjetoService = new CotizacionObjetoService();
