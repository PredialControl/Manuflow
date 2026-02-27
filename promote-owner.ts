import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const email = process.argv[2] || 'admin@manuflow.com.br'
    const user = await prisma.user.update({
        where: { email },
        data: { role: 'SUPER_ADMIN' }
    })
    console.log(`User ${user.email} promoted to SUPER_ADMIN`)
}

main().finally(() => prisma.$disconnect())
