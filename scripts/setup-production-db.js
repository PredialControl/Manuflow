/**
 * Setup do Banco de Produção
 *
 * Popula o banco de produção com dados iniciais essenciais
 * Cria usuários admin e owner
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupProduction() {
    console.log('🚀 Iniciando setup do banco de produção...\n');

    try {
        // 1. Criar empresa padrão
        console.log('📊 Criando empresa...');
        const company = await prisma.company.upsert({
            where: { id: "manuflow-default" },
            update: {},
            create: {
                id: "manuflow-default",
                name: "ManuFlow",
                subscriptionStatus: "ACTIVE",
            },
        });
        console.log('✅ Empresa criada:', company.name, '\n');

        // 2. Criar usuário ADMIN padrão
        console.log('👤 Criando usuário ADMIN padrão...');
        const adminPassword = await bcrypt.hash("admin123", 10);
        const admin = await prisma.user.upsert({
            where: { email: "admin@manuflow.com.br" },
            update: {},
            create: {
                email: "admin@manuflow.com.br",
                name: "Administrador",
                password: adminPassword,
                role: "ADMIN",
                companyId: company.id,
            },
        });
        console.log('✅ Admin criado:', admin.email);
        console.log('   Senha: admin123\n');

        // 3. Criar usuário OWNER (dono do sistema)
        console.log('👤 Criando usuário OWNER...');
        const ownerPassword = await bcrypt.hash("owner2024!", 10);
        const owner = await prisma.user.upsert({
            where: { email: "ricardo@manuflow.com.br" },
            update: {},
            create: {
                email: "ricardo@manuflow.com.br",
                name: "Ricardo Oliveira",
                password: ownerPassword,
                role: "OWNER",
                companyId: company.id,
            },
        });
        console.log('✅ Owner criado:', owner.email);
        console.log('   Senha: owner2024!\n');

        // 4. Criar templates de laudo
        console.log('📋 Criando templates de laudo...');
        const templates = [
            {
                id: "spda",
                name: "SPDA - Sistema de Proteção contra Descargas Atmosféricas",
                category: "ELECTRICAL",
                description: "Laudo técnico de sistema SPDA",
                frequency: "ANNUAL",
                isDefault: true,
                checklist: [
                    "Verificar integridade do sistema de captação",
                    "Inspecionar condicionadores de carga",
                    "Verificar sistema de aterramento",
                ],
                requiredPhotos: [
                    "Foto geral da instalação",
                    "Foto do sistema de captação",
                ],
            },
            {
                id: "incendio",
                name: "Sistema de Incêndio",
                category: "FIRE",
                description: "Laudo técnico de sistema de combate a incêndio",
                frequency: "ANNUAL",
                isDefault: true,
                checklist: [
                    "Verificar extintores",
                    "Inspecionar mangueiras",
                    "Verificar sistema de sprinklers",
                ],
                requiredPhotos: [
                    "Foto dos extintores",
                    "Foto da central de alarme",
                ],
            },
        ];

        for (const template of templates) {
            await prisma.reportTemplate.upsert({
                where: { id: template.id },
                update: template,
                create: template,
            });
        }
        console.log('✅ Templates criados\n');

        console.log('=' .repeat(60));
        console.log('✅ SETUP CONCLUÍDO COM SUCESSO!\n');
        console.log('📝 Credenciais criadas:\n');
        console.log('1️⃣ ADMIN (uso geral):');
        console.log('   Email: admin@manuflow.com.br');
        console.log('   Senha: admin123\n');
        console.log('2️⃣ OWNER (seu usuário principal):');
        console.log('   Email: ricardo@manuflow.com.br');
        console.log('   Senha: owner2024!\n');
        console.log('⚠️  IMPORTANTE: Altere as senhas após primeiro login!');
        console.log('=' .repeat(60));

    } catch (error) {
        console.error('\n❌ ERRO durante setup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Confirmação de segurança
if (process.env.NODE_ENV === 'production' && !process.argv.includes('--confirm')) {
    console.log('\n⚠️  ATENÇÃO: Você está prestes a modificar o banco de PRODUÇÃO!');
    console.log('\nSe tem certeza, execute novamente com:');
    console.log('node scripts/setup-production-db.js --confirm\n');
    process.exit(0);
}

setupProduction()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
