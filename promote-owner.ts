import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const email = process.argv[2] || 'admin@admin.com'
    const user = await prisma.user.update({
        where: { email },
        data: { role: 'OWNER' }
    })
    console.log(`User ${user.email} promoted to OWNER`)
}

main().finally(() => prisma.$disconnect())
