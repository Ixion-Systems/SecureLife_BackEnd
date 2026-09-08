const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe(
    "SELECT * FROM sp_get_client_dashboard('34c8356e-1102-49e8-9577-4c2c912a40b5'::uuid)"
  );
  console.log('SP GET CLIENT DASHBOARD RESULT:', result);

  const policies = await prisma.$queryRawUnsafe(
    "SELECT * FROM sp_get_client_policies('34c8356e-1102-49e8-9577-4c2c912a40b5'::uuid)"
  );
  console.log('SP GET CLIENT POLICIES RESULT:', policies);

  const activity = await prisma.$queryRawUnsafe(
    "SELECT * FROM sp_get_client_activity('34c8356e-1102-49e8-9577-4c2c912a40b5'::uuid, 5)"
  );
  console.log('SP GET CLIENT ACTIVITY RESULT:', activity);
}

main().catch(console.error).finally(() => prisma.$disconnect());
