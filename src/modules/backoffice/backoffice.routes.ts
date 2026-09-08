import { Router } from 'express';
import { backofficeController } from './backoffice.controller';
import {
  loginEmpleadoSchema,
  crearEmpleadoSchema,
  cambiarStatusEmpleadoSchema,
  responderCotizacionSchema,
  evaluarSiniestroSchema,
  derivarGruaSchema,
} from './backoffice.schema';
import { validateBody } from '../../middlewares/validate.middleware';
import {
  authenticateEmpleado,
  requireEmpleadoRol,
} from '../../middlewares/backoffice.middleware';
import { RolEmpleado } from '@prisma/client';

export const backofficeRouter = Router();

// ==============================================================================
// 1. AUTENTICACIÓN Y PERFIL DE BACKOFFICE
// ==============================================================================

/**
 * @route POST /api/v1/backoffice/auth/login
 * @desc  Login de personal de BackOffice, valida credenciales y retorna JWT + rol
 */
backofficeRouter.post(
  '/auth/login',
  validateBody(loginEmpleadoSchema),
  backofficeController.login
);

/**
 * @route GET /api/v1/backoffice/auth/profile
 * @desc  Retorna datos del empleado autenticado
 */
backofficeRouter.get(
  '/auth/profile',
  authenticateEmpleado,
  backofficeController.getProfile
);

// ==============================================================================
// 2. GESTIÓN DE EMPLEADOS (RBAC: EXCLUSIVO ADMIN)
// ==============================================================================

/**
 * @route POST /api/v1/backoffice/empleados
 * @desc  Alta de nuevo empleado con asignación de rol
 */
backofficeRouter.post(
  '/empleados',
  authenticateEmpleado,
  requireEmpleadoRol(RolEmpleado.ADMIN),
  validateBody(crearEmpleadoSchema),
  backofficeController.crearEmpleado
);

/**
 * @route GET /api/v1/backoffice/empleados
 * @desc  Listado de empleados activos/inactivos
 */
backofficeRouter.get(
  '/empleados',
  authenticateEmpleado,
  requireEmpleadoRol(RolEmpleado.ADMIN),
  backofficeController.listarEmpleados
);

/**
 * @route PATCH /api/v1/backoffice/empleados/:id/status
 * @desc  Activar o desactivar empleado
 */
backofficeRouter.patch(
  '/empleados/:id/status',
  authenticateEmpleado,
  requireEmpleadoRol(RolEmpleado.ADMIN),
  validateBody(cambiarStatusEmpleadoSchema),
  backofficeController.cambiarStatusEmpleado
);

// ==============================================================================
// 3. COTIZACIONES MULTIRRAMO (ADMIN, COTIZACIONES, SUPERVISOR)
// ==============================================================================

/**
 * @route GET /api/v1/backoffice/cotizaciones
 * @desc  Listado de cotizaciones de todos los ramos (Auto, Hogar, Vida, Objetos) con filtros
 */
backofficeRouter.get(
  '/cotizaciones',
  authenticateEmpleado,
  requireEmpleadoRol(RolEmpleado.ADMIN, RolEmpleado.COTIZACIONES, RolEmpleado.SUPERVISOR),
  backofficeController.listarCotizaciones
);

/**
 * @route PATCH /api/v1/backoffice/cotizaciones/:id/responder
 * @desc  Aprobar, rechazar o ajustar cotización
 */
backofficeRouter.patch(
  '/cotizaciones/:id/responder',
  authenticateEmpleado,
  requireEmpleadoRol(RolEmpleado.ADMIN, RolEmpleado.COTIZACIONES, RolEmpleado.SUPERVISOR),
  validateBody(responderCotizacionSchema),
  backofficeController.responderCotizacion
);

// ==============================================================================
// 4. SINIESTROS Y PERITAJES (ADMIN, SINIESTROS, SUPERVISOR)
// ==============================================================================

/**
 * @route GET /api/v1/backoffice/siniestros
 * @desc  Listado de siniestros denunciados con fotos de peritaje
 */
backofficeRouter.get(
  '/siniestros',
  authenticateEmpleado,
  requireEmpleadoRol(RolEmpleado.ADMIN, RolEmpleado.SINIESTROS, RolEmpleado.SUPERVISOR),
  backofficeController.listarSiniestros
);

/**
 * @route PATCH /api/v1/backoffice/siniestros/:id/evaluar
 * @desc  Aprobar indemnización o rechazar siniestro con dictamen
 */
backofficeRouter.patch(
  '/siniestros/:id/evaluar',
  authenticateEmpleado,
  requireEmpleadoRol(RolEmpleado.ADMIN, RolEmpleado.SINIESTROS, RolEmpleado.SUPERVISOR),
  validateBody(evaluarSiniestroSchema),
  backofficeController.evaluarSiniestro
);

// ==============================================================================
// 5. ASISTENCIA MECÁNICA Y GRÚAS (ADMIN, GRUA_AUXILIO, SUPERVISOR)
// ==============================================================================

/**
 * @route GET /api/v1/backoffice/gruas
 * @desc  Solicitudes de auxilio mecánico / grúas
 */
backofficeRouter.get(
  '/gruas',
  authenticateEmpleado,
  requireEmpleadoRol(RolEmpleado.ADMIN, RolEmpleado.GRUA_AUXILIO, RolEmpleado.SUPERVISOR),
  backofficeController.listarGruas
);

/**
 * @route PATCH /api/v1/backoffice/gruas/:id/derivar
 * @desc  Asignar proveedor de grúa, móvil y tiempo estimado (ETA)
 */
backofficeRouter.patch(
  '/gruas/:id/derivar',
  authenticateEmpleado,
  requireEmpleadoRol(RolEmpleado.ADMIN, RolEmpleado.GRUA_AUXILIO, RolEmpleado.SUPERVISOR),
  validateBody(derivarGruaSchema),
  backofficeController.derivarGrua
);
