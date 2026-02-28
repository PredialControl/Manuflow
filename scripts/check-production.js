/**
 * Validação de Segurança para Produção
 *
 * Este script valida se comandos perigosos estão sendo executados em produção
 * e BLOQUEIA operações destrutivas
 */

require('dotenv').config();

const DANGEROUS_COMMANDS = [
    'db push --force-reset',
    '--force-reset',
    '--accept-data-loss',
];

const isProduction = process.env.NODE_ENV === 'production' ||
                     process.env.VERCEL_ENV === 'production' ||
                     process.env.DATABASE_URL?.includes('neon.tech'); // Detecta Neon em produção

function checkProductionSafety() {
    const command = process.argv.join(' ');

    // Verificar se é ambiente de produção
    if (isProduction) {
        // Verificar se comando contém operações perigosas
        const isDangerous = DANGEROUS_COMMANDS.some(dangerousCmd =>
            command.includes(dangerousCmd)
        );

        if (isDangerous) {
            console.error('\n❌ ========================================');
            console.error('❌  OPERAÇÃO BLOQUEADA EM PRODUÇÃO!');
            console.error('❌ ========================================\n');
            console.error('🚫 O comando que você tentou executar é DESTRUTIVO');
            console.error('🚫 e pode APAGAR TODOS OS DADOS do banco.\n');
            console.error('⚠️  Comandos bloqueados em produção:');
            DANGEROUS_COMMANDS.forEach(cmd => {
                console.error(`   - ${cmd}`);
            });
            console.error('\n✅ Use comandos seguros em produção:');
            console.error('   - npx prisma migrate deploy');
            console.error('   - npx prisma db push (sem --force-reset)\n');
            console.error('💡 Se REALMENTE precisa resetar o banco:');
            console.error('   1. Faça backup primeiro: node scripts/backup-db.js');
            console.error('   2. Configure NODE_ENV=development temporariamente');
            console.error('   3. Execute o comando');
            console.error('   4. Restaure NODE_ENV=production\n');

            process.exit(1);
        }
    }

    // Se chegou aqui, comando é seguro
    return true;
}

// Executar validação
if (require.main === module) {
    checkProductionSafety();
    console.log('✅ Validação de segurança passou\n');
}

module.exports = { checkProductionSafety, isProduction };
