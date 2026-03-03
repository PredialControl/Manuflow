const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== VERIFICANDO DADOS DA RONDA ===\n');

  // 1. Verificar técnicos
  const technicians = await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
    select: {
      id: true,
      name: true,
      email: true,
      category: true,
      companyId: true,
    },
  });

  console.log(`📋 Total de técnicos: ${technicians.length}`);
  technicians.forEach(tech => {
    console.log(`   - ${tech.name} (${tech.email})`);
    console.log(`     Categoria: ${tech.category || 'SEM CATEGORIA'}`);
    console.log(`     CompanyId: ${tech.companyId}\n`);
  });

  // 2. Verificar ativos totais
  const totalAssets = await prisma.asset.count({
    where: {
      active: true,
      deletedAt: null,
    },
  });

  console.log(`📦 Total de ativos ativos: ${totalAssets}`);

  // 3. Verificar ativos com includeInRonda
  const rondaAssets = await prisma.asset.count({
    where: {
      active: true,
      deletedAt: null,
      includeInRonda: true,
    },
  });

  console.log(`✅ Ativos com includeInRonda: ${rondaAssets}`);

  // 4. Verificar ativos com frequency DAILY
  const dailyAssets = await prisma.asset.count({
    where: {
      active: true,
      deletedAt: null,
      frequency: 'DAILY',
    },
  });

  console.log(`📅 Ativos com frequency DAILY: ${dailyAssets}`);

  // 5. Verificar ativos que atendem TODOS os critérios
  const validRondaAssets = await prisma.asset.findMany({
    where: {
      active: true,
      deletedAt: null,
      includeInRonda: true,
      frequency: 'DAILY',
    },
    select: {
      id: true,
      name: true,
      type: true,
      category: true,
      frequency: true,
      includeInRonda: true,
      contractId: true,
      contract: {
        select: {
          name: true,
          companyId: true,
        },
      },
    },
  });

  console.log(`\n🎯 Ativos válidos para ronda (DAILY + includeInRonda): ${validRondaAssets.length}`);

  if (validRondaAssets.length > 0) {
    console.log('\nDetalhes dos ativos:');
    validRondaAssets.forEach(asset => {
      console.log(`\n   📍 ${asset.name}`);
      console.log(`      Tipo: ${asset.type}`);
      console.log(`      Categoria: ${asset.category || 'SEM CATEGORIA'}`);
      console.log(`      Frequência: ${asset.frequency}`);
      console.log(`      Contrato: ${asset.contract.name}`);
      console.log(`      CompanyId: ${asset.contract.companyId}`);
    });
  } else {
    console.log('\n⚠️  PROBLEMA: Nenhum ativo atende aos critérios!');
    console.log('   Para aparecer na ronda, o ativo precisa ter:');
    console.log('   - active: true');
    console.log('   - includeInRonda: true');
    console.log('   - frequency: DAILY');
  }

  // 6. Verificar distribution de frequencies
  console.log('\n📊 Distribuição de frequências:');
  const frequencies = await prisma.asset.groupBy({
    by: ['frequency'],
    where: {
      active: true,
      deletedAt: null,
    },
    _count: true,
  });

  frequencies.forEach(f => {
    console.log(`   ${f.frequency}: ${f._count} ativos`);
  });

  // 7. Verificar medidores
  const devices = await prisma.measurementDevice.count({
    where: { active: true },
  });

  console.log(`\n📏 Total de medidores ativos: ${devices}`);

  console.log('\n=================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
