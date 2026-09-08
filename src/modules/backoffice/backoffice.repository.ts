import { PrismaClient, RolEmpleado, RamoSeguro, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import {
  CrearEmpleadoDTO,
  ResponderCotizacionDTO,
  EvaluarSiniestroDTO,
  DerivarGruaDTO,
} from './backoffice.schema';

export interface EmpleadoSPRow {
  empleado_id: string;
  email: string;
  password_hash: string;
  nombre: string;
  rol: string;
  activo: boolean;
}

export class BackofficeRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  // ----------------------------------------------------------------------------
  // EMPLEADOS Y AUTH
  // ----------------------------------------------------------------------------

  async autenticarEmpleadoSP(email: string): Promise<EmpleadoSPRow | null> {
    const rows = await this.db.$queryRaw<EmpleadoSPRow[]>`
      SELECT * FROM sp_autenticar_empleado(${email.trim().toLowerCase()}::text);
    `;
    return rows[0] || null;
  }

  async findEmpleadoById(id: string) {
    return this.db.empleado.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findEmpleadoByEmail(email: string) {
    return this.db.empleado.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async crearEmpleadoSP(dto: CrearEmpleadoDTO, passwordHash: string) {
    const rows = await this.db.$queryRaw<{
      empleado_id: string;
      email: string;
      nombre: string;
      rol: string;
      activo: boolean;
      created_at: Date;
    }[]>`
      SELECT * FROM sp_crear_empleado(
        ${dto.email.trim().toLowerCase()}::text,
        ${passwordHash}::text,
        ${dto.nombre.trim()}::text,
        ${dto.rol}::text
      );
    `;
    return rows[0] || null;
  }

  async listarEmpleados(filtros?: { activo?: boolean; rol?: RolEmpleado }) {
    const where: Prisma.EmpleadoWhereInput = {};
    if (filtros?.activo !== undefined) {
      where.activo = filtros.activo;
    }
    if (filtros?.rol) {
      where.rol = filtros.rol;
    }

    return this.db.empleado.findMany({
      where,
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async actualizarStatusEmpleado(id: string, activo: boolean) {
    return this.db.empleado.update({
      where: { id },
      data: { activo },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        updatedAt: true,
      },
    });
  }

  // ----------------------------------------------------------------------------
  // COTIZACIONES MULTIRRAMO
  // ----------------------------------------------------------------------------

  async listarCotizaciones(filtros?: { estado?: string; ramo?: RamoSeguro }) {
    const where: Prisma.CotizacionWhereInput = {};
    if (filtros?.estado) {
      where.estado = filtros.estado;
    }
    if (filtros?.ramo) {
      where.ramo = filtros.ramo;
    }

    return this.db.cotizacion.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                dni: true,
                phone: true,
              },
            },
          },
        },
        cotizacionVida: true,
        cotizacionObjetoPersonal: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async responderCotizacion(
    id: string,
    dto: ResponderCotizacionDTO,
    peritoId: string
  ) {
    const data: Prisma.CotizacionUpdateInput = {
      estado: dto.estado,
      observacionesPerito: dto.observaciones,
      peritoAsignadoId: peritoId,
      fechaRespuesta: new Date(),
    };

    if (dto.primaAjustada !== undefined) {
      data.primaEstimada = new Prisma.Decimal(dto.primaAjustada);
    }
    if (dto.sumaAjustada !== undefined) {
      data.sumaAsegurada = new Prisma.Decimal(dto.sumaAjustada);
    }

    return this.db.cotizacion.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, email: true },
        },
        cotizacionVida: true,
        cotizacionObjetoPersonal: true,
      },
    });
  }

  // ----------------------------------------------------------------------------
  // SINIESTROS
  // ----------------------------------------------------------------------------

  async listarSiniestros(filtros?: { estado?: string; ramo?: RamoSeguro }) {
    const where: Prisma.SiniestroWhereInput = {};
    if (filtros?.estado) {
      where.estado = filtros.estado;
    }
    if (filtros?.ramo) {
      where.ramo = filtros.ramo;
    }

    return this.db.siniestro.findMany({
      where,
      include: {
        poliza: {
          include: {
            cliente: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
            vehiculos: true,
            inmuebles: true,
            vidasAseguradas: true,
            objetosPersonales: true,
          },
        },
      },
      orderBy: { fechaDenuncia: 'desc' },
    });
  }

  async evaluarSiniestro(id: string, dto: EvaluarSiniestroDTO) {
    const data: Prisma.SiniestroUpdateInput = {
      estado: dto.estado,
      dictamenPerito: dto.dictamenPerito,
      fechaResolucion: new Date(),
    };

    if (dto.montoLiquidado !== undefined) {
      data.montoLiquidado = new Prisma.Decimal(dto.montoLiquidado);
    }

    return this.db.siniestro.update({
      where: { id },
      data,
      include: {
        poliza: {
          select: {
            numeroPoliza: true,
            cliente: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });
  }

  // ----------------------------------------------------------------------------
  // ASISTENCIAS Y GRÚAS
  // ----------------------------------------------------------------------------

  async listarGruas(filtros?: { estado?: string }) {
    const where: Prisma.AsistenciaAuxilioWhereInput = {};
    if (filtros?.estado) {
      where.estado = filtros.estado;
    }

    return this.db.asistenciaAuxilio.findMany({
      where,
      include: {
        poliza: {
          include: {
            cliente: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
            vehiculos: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async derivarGrua(id: string, dto: DerivarGruaDTO) {
    return this.db.asistenciaAuxilio.update({
      where: { id },
      data: {
        proveedor: dto.proveedor,
        movilAsignado: dto.movilAsignado,
        etaMinutos: dto.etaMinutos,
        estado: dto.estado || 'DERIVADO',
      },
      include: {
        poliza: {
          select: {
            numeroPoliza: true,
            cliente: { select: { id: true, email: true } },
          },
        },
      },
    });
  }
}

export const backofficeRepository = new BackofficeRepository();
