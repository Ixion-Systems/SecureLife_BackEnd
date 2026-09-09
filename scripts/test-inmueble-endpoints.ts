import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import jwt from 'jsonwebtoken';
import http from 'http';

const JWT_SECRET = process.env.JWT_SECRET || 'securelife_jwt_super_secret_key_2026';

async function runTests() {
  console.log('[TEST] Iniciando suite de pruebas para módulo HOGAR_INMUEBLE...');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const address = server.address() as { port: number };
  const baseUrl = `http://localhost:${address.port}/api/v1/cotizaciones/inmueble`;
  console.log(`[TEST] Servidor de prueba escuchando en http://localhost:${address.port}`);

  try {
    // 1. Obtener o crear un usuario cliente para las pruebas con JWT
    let user = await prisma.user.findFirst({
      where: { email: 'cliente@securelife.com' },
    });

    if (!user) {
      user = await prisma.user.findFirst();
    }

    if (!user) {
      throw new Error('No se encontró ningún usuario para testing en la base de datos');
    }

    const testToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // =========================================================================
    // TEST 1: POST /calcular (Público, cálculo preliminar con m2 estándar)
    // =========================================================================
    console.log('\n--- TEST 1: POST /calcular (Cálculo actuarial estándar) ---');
    const calcPayload = {
      tipoInmueble: 'CASA',
      superficieM2: 100,
      codigoPostal: '1001',
      tipoTecho: 'LOSA',
      tieneAlarma: true,
      tieneRejas: false,
      sumaEdificio: 0, // Debe autocalcularse a 100 * 950.000 = 95.000.000
      sumaContenido: 0, // Debe autocalcularse al 20% = 19.000.000
      sumaElectrodomesticos: 2000000,
      rcLinderos: 3000000,
    };

    const calcRes = await fetch(`${baseUrl}/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calcPayload),
    });

    const calcData = (await calcRes.json()) as {
      status: string;
      data: {
        sumasAseguradas: { edificio: number; contenido: number; total: number };
        desgloseTecnicoMensual: { recargoTecho: number; descuentoSeguridad: number };
      };
    };
    console.log('Status /calcular:', calcRes.status);
    console.log('Data /calcular:', JSON.stringify(calcData, null, 2));

    if (calcRes.status !== 200) {
      throw new Error(`TEST 1 Falló: status ${calcRes.status}`);
    }

    if (calcData.data.sumasAseguradas.edificio !== 95000000) {
      throw new Error(
        `TEST 1 Falló: Se esperaba sumaEdificio 95000000 pero se obtuvo ${calcData.data.sumasAseguradas.edificio}`
      );
    }
    console.log('[SUCCESS] TEST 1 PASÓ: Cálculo actuarial preliminar correcto.');

    // =========================================================================
    // TEST 2: POST /calcular con recargo de techo CHAPA (+8%) y descuento completo (-15%)
    // =========================================================================
    console.log('\n--- TEST 2: POST /calcular con recargo CHAPA y alarma+rejas ---');
    const calcPayloadChapa = {
      tipoInmueble: 'CASA',
      superficieM2: 100,
      codigoPostal: '1001',
      tipoTecho: 'CHAPA', // +8% recargo en edificio
      tieneAlarma: true, // -10%
      tieneRejas: true, // -5% (total -15% en robo)
      sumaEdificio: 95000000,
      sumaContenido: 19000000,
      sumaElectrodomesticos: 2000000,
      rcLinderos: 3000000,
    };

    const calcResChapa = await fetch(`${baseUrl}/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calcPayloadChapa),
    });

    const calcDataChapa = (await calcResChapa.json()) as {
      status: string;
      data: {
        desgloseTecnicoMensual: { recargoTecho: number; descuentoSeguridad: number };
      };
    };
    console.log('Status /calcular (Chapa):', calcResChapa.status);
    console.log('Desglose mensual:', calcDataChapa.data.desgloseTecnicoMensual);

    if (calcDataChapa.data.desgloseTecnicoMensual.recargoTecho <= 0) {
      throw new Error('TEST 2 Falló: El recargo por techo de chapa debería ser > 0');
    }
    if (calcDataChapa.data.desgloseTecnicoMensual.descuentoSeguridad <= 0) {
      throw new Error('TEST 2 Falló: El descuento por alarma y rejas debería ser > 0');
    }
    console.log('[SUCCESS] TEST 2 PASÓ: Recargos y bonificaciones aplicados correctamente.');

    // =========================================================================
    // TEST 3: POST / (Sin autenticación debe dar 401)
    // =========================================================================
    console.log('\n--- TEST 3: POST / (Protección JWT sin token) ---');
    const unauthRes = await fetch(`${baseUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calcPayload),
    });
    console.log('Status sin auth:', unauthRes.status);
    if (unauthRes.status !== 401) {
      throw new Error(`TEST 3 Falló: Se esperaba 401 pero se obtuvo ${unauthRes.status}`);
    }
    console.log('[SUCCESS] TEST 3 PASÓ: Endpoint protegido por JWT correctamente.');

    // =========================================================================
    // TEST 4: POST / (Creación oficial de cotización de inmueble autenticada)
    // =========================================================================
    console.log('\n--- TEST 4: POST / (Creación oficial con token y persistencia) ---');
    const createPayload = {
      tipoInmueble: 'DEPARTAMENTO',
      superficieM2: 85.5,
      codigoPostal: '1425',
      tipoTecho: 'LOSA',
      tieneAlarma: true,
      tieneRejas: false,
      sumaEdificio: 0,
      sumaContenido: 0,
      sumaElectrodomesticos: 1500000,
      rcLinderos: 2000000,
      calle: 'Av. Santa Fe',
      numero: '3200',
      piso: '6',
      depto: 'B',
      ciudad: 'Palermo',
      provincia: 'Ciudad Autónoma de Buenos Aires',
      anioConstruccion: 2018,
      documentosAdjuntos: [
        'https://securelife-storage.com/docs/fachada-palermo.jpg',
        'https://securelife-storage.com/docs/cerradura-seguridad.jpg',
      ],
      tipoRevision: 'REVISION_ESTANDAR',
      esManual: false,
    };

    const createRes = await fetch(`${baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify(createPayload),
    });

    const createData = (await createRes.json()) as {
      status: string;
      data: {
        cotizacionId: string;
        numeroCotizacion: string;
        ramo: string;
        estado: string;
      };
    };
    console.log('Status / (Creación):', createRes.status);
    console.log('Data / (Creación):', JSON.stringify(createData, null, 2));

    if (createRes.status !== 201) {
      throw new Error(`TEST 4 Falló: status ${createRes.status}`);
    }

    const cotizacion = createData.data;
    if (!cotizacion.numeroCotizacion.startsWith('COT-HOGAR-')) {
      throw new Error(`TEST 4 Falló: Formato de número inválido: ${cotizacion.numeroCotizacion}`);
    }
    if (cotizacion.ramo !== 'HOGAR_INMUEBLE') {
      throw new Error(`TEST 4 Falló: Ramo incorrecto: ${cotizacion.ramo}`);
    }
    if (cotizacion.estado !== 'PENDIENTE') {
      throw new Error(`TEST 4 Falló: Estado incorrecto: ${cotizacion.estado}`);
    }

    // Verificar persistencia en base de datos
    const dbCotizacion = await prisma.cotizacion.findUnique({
      where: { id: cotizacion.cotizacionId },
    });

    if (!dbCotizacion) {
      throw new Error('TEST 4 Falló: La cotización no fue encontrada en la base de datos');
    }
    console.log('[SUCCESS] TEST 4 PASÓ: Cotización persistida con éxito en PostgreSQL.');

    // =========================================================================
    // TEST 5: Validación Zod (Superficie negativa debe retornar 422)
    // =========================================================================
    console.log('\n--- TEST 5: Validación Zod (Error preventivo 422) ---');
    const invalidPayload = {
      tipoInmueble: 'CASA',
      superficieM2: -25, // Inválido
    };

    const invalidRes = await fetch(`${baseUrl}/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });

    const invalidData = (await invalidRes.json()) as {
      status: string;
      message: string;
      errors?: unknown;
    };
    console.log('Status validación inválida:', invalidRes.status);
    console.log('Detalles Zod:', invalidData);

    if (invalidRes.status !== 422) {
      throw new Error(`TEST 5 Falló: Se esperaba 422 pero se obtuvo ${invalidRes.status}`);
    }
    console.log('[SUCCESS] TEST 5 PASÓ: Validación Zod preventiva funciona a la perfección.');

    console.log('\n[SUCCESS] TODOS LOS TESTS DEL MÓDULO HOGAR_INMUEBLE PASARON EXITOSAMENTE.');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('[ERROR] Error durante las pruebas:', err);
  process.exit(1);
});
