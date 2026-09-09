import { prisma } from '../../config/database';

export interface DashboardSummaryRow {
  user_id: string;
  email: string;
  active_policies_count: bigint | number;
  next_due_amount: number | string;
  next_due_date: Date | null;
  active_claims_count: bigint | number;
  protection_score: number;
}

export interface PolicyRow {
  policy_id: string;
  numero_poliza: string;
  cliente_id: string;
  ramo: string;
  plan_nombre: string;
  prima_anual: number | string;
  premio_mensual: number | string;
  vigencia_desde: Date;
  vigencia_hasta: Date;
  estado: string;
  created_at: Date;
  vehiculo_patente: string | null;
  vehiculo_marca: string | null;
  vehiculo_modelo: string | null;
  vehiculo_anio: number | null;
  vehiculo_tiene_gnc: boolean | null;
  inmueble_calle: string | null;
  inmueble_numero: string | null;
  inmueble_ciudad: string | null;
  inmueble_provincia: string | null;
  inmueble_tipo: string | null;
}

export interface ActivityRow {
  user_id: string;
  activity_id: string;
  title: string;
  description: string;
  activity_type: string;
  status: string;
  created_at: Date;
}

export interface RoadsideAssistanceRow {
  asistencia_id: string;
  poliza_id: string;
  tipo_asistencia: string;
  estado: string;
  latitud: number | null;
  longitud: number | null;
  direccion: string | null;
  proveedor: string | null;
  movil_asignado: string | null;
  eta_minutos: number | null;
  created_at: Date;
}

export class DashboardRepository {
  /**
   * Invoca el Stored Procedure sp_get_client_dashboard para obtener métricas pre-agregadas
   */
  async getDashboardSummary(userId: string): Promise<DashboardSummaryRow | null> {
    const rows = await prisma.$queryRaw<DashboardSummaryRow[]>`
      SELECT * FROM sp_get_client_dashboard(${userId}::uuid);
    `;
    return rows[0] || null;
  }

  /**
   * Invoca el Stored Procedure sp_get_client_policies para obtener pólizas detalladas
   */
  async getClientPolicies(userId: string): Promise<PolicyRow[]> {
    return prisma.$queryRaw<PolicyRow[]>`
      SELECT * FROM sp_get_client_policies(${userId}::uuid);
    `;
  }

  /**
   * Invoca el Stored Procedure sp_get_client_activity para el timeline cronológico
   */
  async getClientActivity(userId: string, limit: number = 10): Promise<ActivityRow[]> {
    return prisma.$queryRaw<ActivityRow[]>`
      SELECT * FROM sp_get_client_activity(${userId}::uuid, ${limit}::int);
    `;
  }

  /**
   * Invoca el Stored Procedure sp_request_roadside_assistance con validación en el motor
   */
  async requestRoadsideAssistance(
    userId: string,
    policyId: string,
    tipoAsistencia: string,
    lat?: number,
    lng?: number,
    direccion?: string
  ): Promise<RoadsideAssistanceRow | null> {
    const rows = await prisma.$queryRaw<RoadsideAssistanceRow[]>`
      SELECT * FROM sp_request_roadside_assistance(
        ${userId}::uuid,
        ${policyId}::uuid,
        ${tipoAsistencia}::text,
        ${lat ?? null}::numeric,
        ${lng ?? null}::numeric,
        ${direccion ?? null}::text
      );
    `;
    return rows[0] || null;
  }
}

export const dashboardRepository = new DashboardRepository();
