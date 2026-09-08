export interface CrearCotizacionAutoInput {
  userId: string;
  esManual: boolean;
  tipoRevision: string;
  marcaCodigo: string;
  marcaNombre: string;
  modeloCodigo: string;
  modeloNombre: string;
  anio: number;
  patente: string;
  codigoPostal: string;
  planCobertura: string;
  tieneGnc: boolean;
  kilometrajeAnual: number;
  valorDeclarado?: number | null;
  datosRiesgo?: Record<string, unknown>;
  documentosAdjuntos?: unknown[];
}

export interface CotizacionAutomotorCreatedRow {
  cotizacion_id: string;
  numero_cotizacion: string;
  user_id: string;
  ramo: string;
  estado: string;
  tipo_revision: string;
  es_manual: boolean;
  suma_asegurada: number | string;
  prima_estimada: number | string;
  created_at: Date;
}

export interface CotizacionAutoResponse {
  id: string;
  numeroCotizacion: string;
  userId: string;
  ramo: string;
  estado: string;
  tipoRevision: string;
  esManual: boolean;
  sumaAsegurada: number;
  primaEstimada: number;
  createdAt: string;
}

export interface ResponderPeritajeInput {
  cotizacionId: string;
  peritoId: string;
  nuevoEstado: 'COTIZADA' | 'APROBADA' | 'RECHAZADA';
  primaTasada: number;
  sumaTasada: number;
  observaciones: string;
}

export interface ResponderPeritajeRow {
  cotizacion_id: string;
  numero_cotizacion: string;
  estado: string;
  prima_estimada: number | string;
  suma_asegurada: number | string;
  fecha_respuesta: Date;
}

export interface ResponderPeritajeResponse {
  cotizacionId: string;
  numeroCotizacion: string;
  estado: string;
  primaEstimada: number;
  sumaAsegurada: number;
  fechaRespuesta: string;
}
