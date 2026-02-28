const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const defaultColumns = [
    {
        title: "Em andamento",
        statusKey: "IN_PROGRESS",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10",
        order: 1,
        isDefault: true,
    },
    {
        title: "Aguardando aprovação",
        statusKey: "PENDING_APPROVAL",
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-500/10",
        order: 2,
        isDefault: true,
    },
    {
        title: "Em orçamento",
        statusKey: "BUDGETING",
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-500/10",
        order: 3,
        isDefault: true,
    },
    {
        title: "Aprovado para execução",
        statusKey: "APPROVED_FOR_EXECUTION",
        color: "text-cyan-600 dark:text-cyan-400",
        bgColor: "bg-cyan-500/10",
        order: 4,
        isDefault: true,
    },
    {
        title: "Em dia",
        statusKey: "APPROVED",
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-500/10",
        order: 5,
        isDefault: true,
    },
    {
        title: "Próximo ao vencimento",
        statusKey: "EXPIRING_SOON",
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-500/10",
        order: 6,
        isDefault: true,
    },
    {
        title: "Vencidos",
        statusKey: "EXPIRED",
        color: "text-rose-600 dark:text-rose-400",
        bgColor: "bg-rose-500/10",
        order: 7,
        isDefault: true,
    },
];

async function main() {
    console.log("🔄 Populando colunas padrão de laudos...");

    // Buscar todas as empresas
    const companies = await prisma.company.findMany({
        select: { id: true, name: true }
    });

    console.log(`📊 Encontradas ${companies.length} empresas`);

    for (const company of companies) {
        console.log(`\n🏢 Processando empresa: ${company.name}`);

        for (const column of defaultColumns) {
            try {
                await prisma.reportColumn.upsert({
                    where: {
                        companyId_statusKey: {
                            companyId: company.id,
                            statusKey: column.statusKey,
                        }
                    },
                    update: {},
                    create: {
                        companyId: company.id,
                        ...column,
                    }
                });
                console.log(`  ✅ ${column.title}`);
            } catch (error) {
                console.error(`  ❌ Erro ao criar ${column.title}:`, error.message);
            }
        }
    }

    console.log("\n✨ Colunas padrão populadas com sucesso!");
}

main()
    .catch((e) => {
        console.error("❌ Erro:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
