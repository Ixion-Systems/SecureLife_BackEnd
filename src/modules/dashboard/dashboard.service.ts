import { dashboardRepository, DashboardRepository } from './dashboard.repository';
import { BadRequestError } from '../../middlewares/error.middleware';

export class DashboardService {
  constructor(private readonly repository: DashboardRepository = dashboardRepository) {}

  /**
   * Obtiene las métricas agregadas del cliente desde el Stored Procedure
   */
  async getClientSummary(userId: string) {
    const raw = await this.repository.getDashboardSummary(userId);

    if (!raw) {
      return {
        activePoliciesCount: 0,
        nextDueAmount: 0,
        nextDueDate: null,
        activeClaimsCount: 0,
        protectionScore: 0,
      };
    }

    return {
      activePoliciesCount: Number(raw.active_policies_count),
      nextDueAmount: Number(raw.next_due_amount),
      nextDueDate: raw.next_due_date,
      activeClaimsCount: Number(raw.active_claims_count),
      protectionScore: Number(raw.protection_score),
    };
  }

  /**
   * Obtiene las pólizas del cliente desde el Stored Procedure
   */
  async getClientPolicies(userId: string) {
    const rows = await this.repository.getClientPolicies(userId);

    return rows.map((p) => ({
      id: p.policy_id,
      policyNumber: p.numero_poliza,
      branch: p.ramo.toLowerCase(),
      planName: p.plan_nombre,
      annualPremium: Number(p.prima_anual),
      monthlyPremium: Number(p.premio_mensual),
      validFrom: p.vigencia_desde,
      validUntil: p.vigencia_hasta,
      status: p.estado,
      createdAt: p.created_at,
      vehicle: p.vehiculo_patente
        ? {
            plate: p.vehiculo_patente,
            brand: p.vehiculo_marca,
            model: p.vehiculo_modelo,
            year: p.vehiculo_anio,
            hasGnc: p.vehiculo_tiene_gnc,
          }
        : null,
      property: p.inmueble_calle
        ? {
            street: p.inmueble_calle,
            number: p.inmueble_numero,
            city: p.inmueble_ciudad,
            province: p.inmueble_provincia,
            propertyType: p.inmueble_tipo,
          }
        : null,
    }));
  }

  /**
   * Obtiene el feed de actividad cronológica
   */
  async getClientActivity(userId: string, limit: number = 10) {
    const rows = await this.repository.getClientActivity(userId, limit);

    return rows.map((a) => ({
      id: a.activity_id,
      title: a.title,
      description: a.description,
      type: a.activity_type,
      status: a.status,
      date: a.created_at,
    }));
  }


  /**
   * Solicita auxilio de grúa invocando el Stored Procedure con validaciones de motor
   */
  async requestAssistance(
    userId: string,
    data: {
      policyId: string;
      tipoAsistencia: string;
      latitud?: number;
      longitud?: number;
      direccion?: string;
    }
  ) {
    try {
      return await this.repository.requestRoadsideAssistance(
        userId,
        data.policyId,
        data.tipoAsistencia,
        data.latitud,
        data.longitud,
        data.direccion
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('No puede llamar una grúa')) {
        throw new BadRequestError('No puede llamar una grúa sin poseer una póliza automotor activa.');
      }
      throw err;
    }
  }
}

export const dashboardService = new DashboardService();
