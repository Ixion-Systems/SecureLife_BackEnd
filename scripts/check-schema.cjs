const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const countTasas = await prisma.tasaRiesgoPostal.count();
  console.log('Count tasas postal:', countTasas);
  const sampleTasas = await prisma.tasaRiesgoPostal.findMany({ take: 5 });
  console.log('Sample tasas:', sampleTasas);
}

check().catch(console.error).finally(() => prisma.$disconnect());
