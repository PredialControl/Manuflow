import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const newPassword = "Rpo200510";
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updated = await prisma.user.update({
    where: { email: "admin@manuflow.com.br" },
    data: { password: hashedPassword },
  });

  console.log("✅ Senha atualizada com sucesso!");
  console.log(`   Email: ${updated.email}`);
  console.log(`   Nome: ${updated.name}`);
  console.log(`   Nova senha: ${newPassword}`);
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
