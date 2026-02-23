import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Apagando todos os medidores...');
  
  // Apagar todas as leituras primeiro (FK constraint)
  const deletedEntries = await prisma.measurementEntry.deleteMany({});
  console.log(`✅ ${deletedEntries.count} leituras apagadas`);
  
  // Apagar todos os medidores
  const deletedDevices = await prisma.measurementDevice.deleteMany({});
  console.log(`✅ ${deletedDevices.count} medidores apagados`);
  
  console.log('✅ Limpeza completa!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
