const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRondaAPI() {
  console.log('\n=== TESTANDO API /api/ronda/assets ===\n');

  try {
    // Simular o que a API faz
    const userCategory = 'ELETRICA';

    const categoryFilter = userCategory
      ? {
          OR: [
            { category: userCategory },
            { category: "GERAL" },
            { category: null },
          ],
        }
      : {};

    console.log('📋 Filtro de categoria:', JSON.stringify(categoryFilter, null, 2));

    const assets = await prisma.asset.findMany({
      where: {
        active: true,
        deletedAt: null,
        includeInRonda: true,
        frequency: "DAILY",
        ...categoryFilter,
      },
      select: {
        id: true,
        name: true,
        type: true,
        location: true,
        image: true,
        _count: {
          select: {
            scripts: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(`✅ Ativos encontrados: ${assets.length}\n`);

    if (assets.length > 0) {
      assets.forEach(a => {
        console.log(`   - ${a.name} (${a._count.scripts} perguntas)`);
      });
    }

    // Buscar medidores
    const devices = await prisma.measurementDevice.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        unit: true,
      },
    });

    console.log(`\n📏 Medidores encontrados: ${devices.length}\n`);

    if (devices.length > 0) {
      devices.forEach(d => {
        console.log(`   - ${d.name} (${d.type} - ${d.unit})`);
      });
    }

    const total = assets.length + devices.length;
    console.log(`\n🎯 TOTAL DE ITENS NA RONDA: ${total}\n`);

    if (total === 0) {
      console.log('⚠️  PROBLEMA: Nenhum item será exibido na ronda!');
    }

  } catch (error) {
    console.error('❌ ERRO:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRondaAPI();
