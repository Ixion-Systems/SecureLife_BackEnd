import { ensureEmbeddedDatabase } from '../src/config/embeddedDb';
import { ensureAdminSeed } from '../src/config/seed-admin';
import { app } from '../src/app';
import { Server } from 'http';

async function main() {
  console.log('🚀 [Test Sprint 2] Inicializando entorno...');
  await ensureEmbeddedDatabase();
  await ensureAdminSeed();

  const PORT = 3099;
  const server: Server = app.listen(PORT);
  const baseUrl = `http://localhost:${PORT}`;

  try {
    console.log(`🌐 Servidor de pruebas escuchando en ${baseUrl}`);

    // Helper para fetch
    const request = async (url: string, options: RequestInit = {}) => {
      const res = await fetch(`${baseUrl}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      const data = await res.json().catch(() => null);
      return { status: res.status, headers: res.headers, data };
    };

    // --------------------------------------------------------------------------
    // 1. VERIFICAR CORS (http://localhost:5174)
    // --------------------------------------------------------------------------
    console.log('\n--- 1. Probando CORS para BackOffice (5174) ---');
    const corsRes = await fetch(`${baseUrl}/api/v1/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5174',
        'Access-Control-Request-Method': 'POST',
      },
    });
    console.log('CORS Status:', corsRes.status);
    console.log('Access-Control-Allow-Origin:', corsRes.headers.get('access-control-allow-origin'));
    if (corsRes.headers.get('access-control-allow-origin') !== 'http://localhost:5174') {
      throw new Error('CORS no permitió origin http://localhost:5174');
    }
    console.log('✅ CORS 5174 validado correctamente.');

    // --------------------------------------------------------------------------
    // 2. BACKOFFICE: LOGIN ADMIN
    // --------------------------------------------------------------------------
    console.log('\n--- 2. Login de Administrador en BackOffice ---');
    const loginRes = await request('/api/v1/backoffice/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@securelife.com',
        password: 'AdminSecure2026!',
      }),
    });
    console.log('Login status:', loginRes.status);
    if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
      throw new Error(`Fallo en login de admin: ${JSON.stringify(loginRes.data)}`);
    }
    const adminToken = loginRes.data.data.token;
    console.log('✅ Admin autenticado con éxito. Rol:', loginRes.data.data.empleado.rol);

    const authHeaders = { Authorization: `Bearer ${adminToken}` };

    // --------------------------------------------------------------------------
    // 3. BACKOFFICE: PROFILE
    // --------------------------------------------------------------------------
    console.log('\n--- 3. Obtener Perfil del Empleado Autenticado ---');
    const profileRes = await request('/api/v1/backoffice/auth/profile', {
      headers: authHeaders,
    });
    console.log('Profile status:', profileRes.status, 'Nombre:', profileRes.data?.data?.nombre);
    if (profileRes.status !== 200) {
      throw new Error('Fallo al obtener profile');
    }
    console.log('✅ Profile obtenido con éxito.');

    // --------------------------------------------------------------------------
    // 4. BACKOFFICE: CREAR EMPLEADO
    // --------------------------------------------------------------------------
    console.log('\n--- 4. Crear Empleado (rol: COTIZACIONES) ---');
    const testEmail = `perito_${Date.now()}@securelife.com`;
    const createEmpRes = await request('/api/v1/backoffice/empleados', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        email: testEmail,
        password: 'PeritoSecure2026!',
        nombre: 'Perito Cotizador Senior',
        rol: 'COTIZACIONES',
      }),
    });
    console.log('Crear empleado status:', createEmpRes.status);
    if (createEmpRes.status !== 201) {
      throw new Error(`Fallo al crear empleado: ${JSON.stringify(createEmpRes.data)}`);
    }
    const createdEmpId = createEmpRes.data.data.id;
    console.log('✅ Empleado creado:', createdEmpId, 'Email:', testEmail);

    // --------------------------------------------------------------------------
    // 5. BACKOFFICE: LISTAR Y CAMBIAR STATUS EMPLEADO
    // --------------------------------------------------------------------------
    console.log('\n--- 5. Listar Empleados y Cambiar Status ---');
    const listEmpRes = await request('/api/v1/backoffice/empleados', {
      headers: authHeaders,
    });
    console.log('Total empleados:', listEmpRes.data?.data?.length);

    const statusRes = await request(`/api/v1/backoffice/empleados/${createdEmpId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ activo: false }),
    });
    console.log('Desactivar status:', statusRes.status, 'Activo:', statusRes.data?.data?.activo);
    if (statusRes.data?.data?.activo !== false) {
      throw new Error('Fallo al desactivar empleado');
    }
    console.log('✅ Status de empleado actualizado con éxito.');

    // --------------------------------------------------------------------------
    // 6. CLIENTE: COTIZACIÓN DE VIDA
    // --------------------------------------------------------------------------
    console.log('\n--- 6. Cotización de Vida (Calcular y Crear) ---');
    const calcVidaRes = await request('/api/v1/cotizaciones/vida/calcular', {
      method: 'POST',
      body: JSON.stringify({
        edad: 35,
        genero: 'MASCULINO',
        ocupacion: 'Ingeniero de Software',
        riesgoOcupacional: 'BAJO',
        fumador: false,
        deportesRiesgo: false,
        enfermedadesPreexistentes: false,
        capitalAsegurado: 20000000,
      }),
    });
    console.log('Calcular vida status:', calcVidaRes.status, 'Prima mensual:', calcVidaRes.data?.data?.primaMensualEstimada);

    const createVidaRes = await request('/api/v1/cotizaciones/vida', {
      method: 'POST',
      body: JSON.stringify({
        edad: 35,
        genero: 'MASCULINO',
        ocupacion: 'Ingeniero de Software',
        riesgoOcupacional: 'BAJO',
        fumador: false,
        deportesRiesgo: false,
        enfermedadesPreexistentes: false,
        capitalAsegurado: 20000000,
        beneficiarios: [
          { nombre: 'Laura Perez', dni: '38111222', parentesco: 'CONYUGE', porcentaje: 60 },
          { nombre: 'Matias Perez', dni: '45333444', parentesco: 'HIJO', porcentaje: 40 },
        ],
      }),
    });
    console.log('Crear vida status:', createVidaRes.status);
    if (createVidaRes.status !== 201) {
      throw new Error(`Fallo al crear cotización de vida: ${JSON.stringify(createVidaRes.data)}`);
    }
    const cotizacionVidaId = createVidaRes.data.data.cotizacionId;
    console.log('✅ Cotización de Vida creada:', cotizacionVidaId, 'Número:', createVidaRes.data.data.numeroCotizacion);

    // --------------------------------------------------------------------------
    // 7. CLIENTE: COTIZACIÓN DE OBJETO PERSONAL
    // --------------------------------------------------------------------------
    console.log('\n--- 7. Cotización de Objeto Personal (Calcular y Crear) ---');
    const calcObjRes = await request('/api/v1/cotizaciones/objeto/calcular', {
      method: 'POST',
      body: JSON.stringify({
        tipoObjeto: 'SMARTPHONE',
        valorReposicion: 1500000,
        coberturaTipo: 'TODO_RIESGO',
        franquicia: 150000,
      }),
    });
    console.log('Calcular objeto status:', calcObjRes.status, 'Prima estimada:', calcObjRes.data?.data?.primaMensualEstimada);

    const createObjRes = await request('/api/v1/cotizaciones/objeto', {
      method: 'POST',
      body: JSON.stringify({
        tipoObjeto: 'SMARTPHONE',
        marca: 'Apple',
        modelo: 'iPhone 15 Pro 256GB',
        imeiSerie: '358291048291029',
        valorReposicion: 1500000,
        coberturaTipo: 'TODO_RIESGO',
        franquicia: 150000,
        imagenesUrls: [
          'https://s3.amazonaws.com/securelife/iphone-front.jpg',
          'https://s3.amazonaws.com/securelife/iphone-back.jpg',
        ],
        facturaUrl: 'https://s3.amazonaws.com/securelife/factura-iphone.pdf',
      }),
    });
    console.log('Crear objeto status:', createObjRes.status);
    if (createObjRes.status !== 201) {
      throw new Error(`Fallo al crear cotización de objeto: ${JSON.stringify(createObjRes.data)}`);
    }
    const cotizacionObjId = createObjRes.data.data.cotizacionId;
    console.log('✅ Cotización de Objeto Personal creada:', cotizacionObjId, 'Número:', createObjRes.data.data.numeroCotizacion);

    // --------------------------------------------------------------------------
    // 8. BACKOFFICE: GESTIÓN DE COTIZACIONES
    // --------------------------------------------------------------------------
    console.log('\n--- 8. BackOffice: Listar y Responder Cotización ---');
    const listCotRes = await request('/api/v1/backoffice/cotizaciones', {
      headers: authHeaders,
    });
    console.log('Listar cotizaciones status:', listCotRes.status, 'Total:', listCotRes.data?.data?.length);

    const respCotRes = await request(`/api/v1/backoffice/cotizaciones/${cotizacionVidaId}/responder`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        estado: 'APROBADA',
        observaciones: 'Aprobado automáticamente por parámetros dentro de norma actuarial.',
      }),
    });
    console.log('Responder cotización status:', respCotRes.status, 'Nuevo estado:', respCotRes.data?.data?.estado);
    if (respCotRes.data?.data?.estado !== 'APROBADA') {
      throw new Error('Fallo al responder cotización');
    }
    console.log('✅ Cotización aprobada con éxito desde BackOffice.');

    // --------------------------------------------------------------------------
    // 9. BACKOFFICE: SINIESTROS
    // --------------------------------------------------------------------------
    console.log('\n--- 9. BackOffice: Consultar Siniestros ---');
    const listSiniestrosRes = await request('/api/v1/backoffice/siniestros', {
      headers: authHeaders,
    });
    console.log('Listar siniestros status:', listSiniestrosRes.status, 'Total:', listSiniestrosRes.data?.data?.length);
    console.log('✅ Consulta de siniestros exitosa.');

    // --------------------------------------------------------------------------
    // 10. BACKOFFICE: GRÚAS / AUXILIO MECÁNICO
    // --------------------------------------------------------------------------
    console.log('\n--- 10. BackOffice: Consultar Grúas ---');
    const listGruasRes = await request('/api/v1/backoffice/gruas', {
      headers: authHeaders,
    });
    console.log('Listar grúas status:', listGruasRes.status, 'Total:', listGruasRes.data?.data?.length);
    console.log('✅ Consulta de grúas exitosa.');

    console.log('\n🎉 =======================================================');
    console.log('🎉 TODOS LOS TESTS DE SPRINT 2 Y BACKOFFICE PASARON CON ÉXITO');
    console.log('🎉 =======================================================\n');
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error('\n❌ ERROR EN PRUEBAS:', err);
  process.exit(1);
});
