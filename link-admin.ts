import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const admin = await prisma.user.findFirst({
        where: {
            OR: [
                { role: 'OWNER' },
                { email: 'admin@admin.com' }
            ]
        }
    })

    if (!admin) {
        console.log('Admin user not found')
        return
    }

    const contracts = await prisma.contract.findMany()
    console.log(`Linking user ${admin.email} to ${contracts.length} contracts...`)

    for (const contract of contracts) {
        await prisma.userContract.upsert({
            where: {
                userId_contractId: {
                    userId: admin.id,
                    contractId: contract.id
                }
            },
            update: {},
            create: {
                userId: admin.id,
                contractId: contract.id
            }
        })
    }

    console.log('Finished linking.')
}

main().finally(() => prisma.$disconnect())
