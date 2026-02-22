import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Pegar o primeiro contrato
  const contract = await prisma.contract.findFirst();
  
  if (!contract) {
    console.log('❌ Nenhum contrato encontrado!');
    return;
  }
  
  console.log(`📋 Criando medidores para contrato: ${contract.name} (${contract.id})`);
  
  // Criar medidor de ÁGUA
  const waterMeter = await prisma.measurementDevice.create({
    data: {
      name: 'Hidrômetro Principal',
      type: 'WATER',
      unit: 'm³',
      serialNumber: 'H-001',
      contractId: contract.id,
      companyId: contract.companyId,
    },
  });
  console.log(`✅ Medidor de ÁGUA criado: ${waterMeter.name}`);

  // Criar medidor de ENERGIA
  const energyMeter = await prisma.measurementDevice.create({
    data: {
      name: 'Relógio de Energia',
      type: 'ENERGY',
      unit: 'kWh',
      serialNumber: 'E-001',
      contractId: contract.id,
      companyId: contract.companyId,
    },
  });
  console.log(`✅ Medidor de ENERGIA criado: ${energyMeter.name}`);
  
  console.log('🎉 Medidores criados com sucesso!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
