import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Buscar todos os usuários para você escolher
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  console.log("\n📋 Usuários existentes:");
  console.log("========================");
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} - ${user.name} (${user.role})`);
  });

  // Atualizar o primeiro usuário ADMIN para SUPER_ADMIN
  const adminUser = users.find((u) => u.role === "ADMIN" || u.role === "OWNER");

  if (!adminUser) {
    console.log("\n❌ Nenhum usuário ADMIN/OWNER encontrado!");
    console.log("💡 Criando usuário SUPER_ADMIN padrão...");

    // Criar usuário SUPER_ADMIN se não existir nenhum ADMIN
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const superAdmin = await prisma.user.create({
      data: {
        email: "superadmin@manuflow.com",
        name: "Super Admin ManuFlow",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        companyId: "manuflow-default",
      },
    });

    console.log("\n✅ Usuário SUPER_ADMIN criado:");
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Senha: admin123`);
    console.log(`   Role: ${superAdmin.role}`);
  } else {
    // Atualizar usuário existente para SUPER_ADMIN
    const updated = await prisma.user.update({
      where: { id: adminUser.id },
      data: { role: "SUPER_ADMIN" },
    });

    console.log(`\n✅ Usuário atualizado para SUPER_ADMIN:`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   Nome: ${updated.name}`);
    console.log(`   Role: ${updated.role}`);
    console.log(`\n💡 Faça logout e login novamente com este usuário!`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
