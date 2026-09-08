const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSp() {
  console.log('Testing sp_calcular_cotizacion_inmueble...');
  const calcResult = await prisma.$queryRawUnsafe(`
    SELECT * FROM sp_calcular_cotizacion_inmueble(
      'CASA'::text,
      120.00::numeric,
      '1001'::text,
      'CHAPA'::text,
      true::boolean,
      true::boolean,
      0::numeric,
      0::numeric,
      2500000.00::numeric,
      5000000.00::numeric
    );
  `);
  console.log('Calc Result:', calcResult);

  console.log('Testing sp_crear_cotizacion_inmueble...');
  const createResult = await prisma.$queryRawUnsafe(`
    SELECT * FROM sp_crear_cotizacion_inmueble(
      NULL,
      'CASA'::text,
      120.00::numeric,
      '1001'::text,
      'CHAPA'::text,
      true::boolean,
      true::boolean,
      0::numeric,
      0::numeric,
      2500000.00::numeric,
      5000000.00::numeric,
      '{"calle": "Av. Libertador", "numero": "1500", "ciudad": "CABA", "provincia": "Buenos Aires"}'::jsonb,
      '["https://s3.amazonaws.com/securelife/fachada1.jpg"]'::jsonb,
      'REVISION_ESTANDAR'::text,
      false::boolean
    );
  `);
  console.log('Create Result:', createResult);
}

testSp().catch(console.error).finally(() => prisma.$disconnect());
