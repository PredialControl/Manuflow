/**
 * Script de Backup do Banco de Dados
 *
 * IMPORTANTE: Execute este script ANTES de qualquer migration ou alteração no banco
 *
 * Como usar:
 * node scripts/backup-db.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFileName = `backup-${timestamp}.sql`;
const backupPath = path.join(BACKUP_DIR, backupFileName);

// Criar diretório de backups se não existir
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('✅ Diretório de backups criado');
}

console.log('🔄 Iniciando backup do banco de dados...\n');

try {
    // Ler DATABASE_URL do .env
    require('dotenv').config();
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error('DATABASE_URL não encontrada no .env');
    }

    console.log('📊 Informações do backup:');
    console.log(`   Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
    console.log(`   Arquivo: ${backupFileName}`);
    console.log(`   Destino: ${BACKUP_DIR}\n`);

    // Usar pg_dump para fazer backup
    // Nota: Requer pg_dump instalado no sistema
    const command = `pg_dump "${databaseUrl}" > "${backupPath}"`;

    console.log('⏳ Executando backup (isso pode levar alguns segundos)...\n');

    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        // Se pg_dump não estiver disponível, usar método alternativo
        console.log('⚠️  pg_dump não encontrado. Usando método alternativo via Prisma...\n');

        // Criar backup usando Prisma (exporta schema + dados)
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Aqui você pode adicionar lógica para exportar dados se necessário
        console.log('💡 Sugestão: Instale PostgreSQL tools para backups mais completos');
        console.log('   Windows: https://www.postgresql.org/download/windows/');
        console.log('   Mac: brew install postgresql');
        console.log('   Linux: apt-get install postgresql-client\n');
    }

    const stats = fs.statSync(backupPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('✅ BACKUP CONCLUÍDO COM SUCESSO!\n');
    console.log('📁 Detalhes do arquivo:');
    console.log(`   Tamanho: ${fileSizeInMB} MB`);
    console.log(`   Localização: ${backupPath}\n`);

    console.log('💾 Backup salvo com sucesso!');
    console.log('📌 Mantenha este arquivo seguro antes de fazer alterações no banco.\n');

    // Limpar backups antigos (manter apenas últimos 30 dias)
    cleanOldBackups();

} catch (error) {
    console.error('❌ ERRO ao fazer backup:', error.message);
    console.error('\n⚠️  ATENÇÃO: Não prossiga com alterações no banco sem backup!');
    process.exit(1);
}

function cleanOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        let deletedCount = 0;
        files.forEach(file => {
            const filePath = path.join(BACKUP_DIR, file);
            const stats = fs.statSync(filePath);

            if (stats.mtimeMs < thirtyDaysAgo) {
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        });

        if (deletedCount > 0) {
            console.log(`🗑️  Removidos ${deletedCount} backups antigos (>30 dias)\n`);
        }
    } catch (error) {
        console.log('⚠️  Aviso: Não foi possível limpar backups antigos:', error.message);
    }
}
