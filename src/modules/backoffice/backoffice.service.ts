import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { RolEmpleado, RamoSeguro } from '@prisma/client';
import {
  backofficeRepository,
  BackofficeRepository,
} from './backoffice.repository';
import {
  LoginEmpleadoDTO,
  CrearEmpleadoDTO,
  ResponderCotizacionDTO,
  EvaluarSiniestroDTO,
  DerivarGruaDTO,
} from './backoffice.schema';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../../middlewares/error.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'securelife_jwt_super_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export class BackofficeService {
  constructor(
    private readonly repo: BackofficeRepository = backofficeRepository
  ) {}

  // ----------------------------------------------------------------------------
  // AUTENTICACIÓN Y PERFIL
  // ----------------------------------------------------------------------------

  async login(dto: LoginEmpleadoDTO) {
    const empleado = await this.repo.findEmpleadoByEmail(dto.email);

    if (!empleado) {
      throw new UnauthorizedError('Credenciales inválidas de acceso a BackOffice');
    }

    if (!empleado.activo) {
      throw new ForbiddenError('Esta cuenta de empleado se encuentra inactiva. Contacte al Administrador');
    }

    const match = await bcrypt.compare(dto.password, empleado.passwordHash);
    if (!match) {
      throw new UnauthorizedError('Credenciales inválidas de acceso a BackOffice');
    }

    const payload = {
      empleadoId: empleado.id,
      email: empleado.email,
      nombre: empleado.nombre,
      rol: empleado.rol,
      tipo: 'EMPLEADO',
    };

    const signOptions: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
    };

    const token = jwt.sign(payload, JWT_SECRET, signOptions);

    return {
      token,
      empleado: {
        id: empleado.id,
        email: empleado.email,
        nombre: empleado.nombre,
        rol: empleado.rol,
        activo: empleado.activo,
      },
    };
  }

  async getProfile(empleadoId: string) {
    const empleado = await this.repo.findEmpleadoById(empleadoId);
    if (!empleado) {
      throw new NotFoundError('Empleado no encontrado');
    }
    return empleado;
  }

  // ----------------------------------------------------------------------------
  // GESTIÓN DE EMPLEADOS (SOLO ADMIN)
  // ----------------------------------------------------------------------------

  async crearEmpleado(dto: CrearEmpleadoDTO) {
    const existe = await this.repo.findEmpleadoByEmail(dto.email);
    if (existe) {
      throw new ConflictError(`Ya existe un empleado registrado con el correo ${dto.email}`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const nuevo = await this.repo.crearEmpleadoSP(dto, passwordHash);

    if (!nuevo) {
      throw new BadRequestError('No se pudo completar el registro del empleado');
    }

    return {
      id: nuevo.empleado_id,
      email: nuevo.email,
      nombre: nuevo.nombre,
      rol: nuevo.rol,
      activo: nuevo.activo,
      createdAt: nuevo.created_at,
    };
  }

  async listarEmpleados(filtros?: { activo?: boolean; rol?: RolEmpleado }) {
    return this.repo.listarEmpleados(filtros);
  }

  async cambiarStatusEmpleado(id: string, activo: boolean) {
    const empleado = await this.repo.findEmpleadoById(id);
    if (!empleado) {
      throw new NotFoundError('Empleado no encontrado para actualizar estado');
    }

    return this.repo.actualizarStatusEmpleado(id, activo);
  }

  // ----------------------------------------------------------------------------
  // GESTIÓN DE COTIZACIONES
  // ----------------------------------------------------------------------------

  async listarCotizaciones(filtros?: { estado?: string; ramo?: RamoSeguro }) {
    return this.repo.listarCotizaciones(filtros);
  }

  async responderCotizacion(
    id: string,
    dto: ResponderCotizacionDTO,
    peritoId: string
  ) {
    return this.repo.responderCotizacion(id, dto, peritoId);
  }

  // ----------------------------------------------------------------------------
  // GESTIÓN DE SINIESTROS
  // ----------------------------------------------------------------------------

  async listarSiniestros(filtros?: { estado?: string; ramo?: RamoSeguro }) {
    return this.repo.listarSiniestros(filtros);
  }

  async evaluarSiniestro(id: string, dto: EvaluarSiniestroDTO) {
    return this.repo.evaluarSiniestro(id, dto);
  }

  // ----------------------------------------------------------------------------
  // GESTIÓN DE AUXILIO MECÁNICO / GRÚAS
  // ----------------------------------------------------------------------------

  async listarGruas(filtros?: { estado?: string }) {
    return this.repo.listarGruas(filtros);
  }

  async derivarGrua(id: string, dto: DerivarGruaDTO) {
    return this.repo.derivarGrua(id, dto);
  }
}

export const backofficeService = new BackofficeService();
