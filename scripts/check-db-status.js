/**
 * Verificar Status do Banco de Dados
 *
 * Verifica se o banco tem os dados essenciais
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
    console.log('🔍 Verificando status do banco de dados...\n');

    try {
        // Verificar empresas
        const companies = await prisma.company.findMany();
        console.log('📊 Empresas no banco:', companies.length);
        if (companies.length > 0) {
            companies.forEach(c => {
                console.log(`   - ${c.name} (ID: ${c.id})`);
            });
        } else {
            console.log('   ⚠️  NENHUMA empresa encontrada!');
        }

        // Verificar usuários
        const users = await prisma.user.findMany({
            include: { company: true }
        });
        console.log('\n👥 Usuários no banco:', users.length);
        if (users.length > 0) {
            users.forEach(u => {
                console.log(`   - ${u.name} (${u.email}) - Role: ${u.role} - Empresa: ${u.company.name}`);
            });
        } else {
            console.log('   ⚠️  NENHUM usuário encontrado!');
        }

        // Verificar contratos
        const contracts = await prisma.contract.findMany();
        console.log('\n📄 Contratos no banco:', contracts.length);
        if (contracts.length > 0) {
            contracts.forEach(c => {
                console.log(`   - ${c.name} (${c.company})`);
            });
        } else {
            console.log('   ℹ️  Nenhum contrato (normal após reset)');
        }

        console.log('\n' + '='.repeat(60));

        if (companies.length === 0 || users.length === 0) {
            console.log('\n❌ PROBLEMA DETECTADO!');
            console.log('\nO banco está vazio após o reset.');
            console.log('Você precisa criar novamente:');
            console.log('1. Uma empresa (Company)');
            console.log('2. Um usuário ADMIN/OWNER');
            console.log('\nOpções:');
            console.log('- Rodar seed: npm run db:seed');
            console.log('- Ou criar manualmente via Prisma Studio: npm run db:studio');
        } else {
            console.log('\n✅ Banco está OK! Empresa e usuário existem.');
        }

    } catch (error) {
        console.error('\n❌ Erro ao verificar banco:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
