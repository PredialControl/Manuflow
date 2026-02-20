import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // Dados do usuário
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                category: true,
            },
        });

        // Contratos associados
        const userContracts = await prisma.userContract.findMany({
            where: { userId: session.user.id },
            include: {
                contract: {
                    select: {
                        id: true,
                        name: true,
                        active: true,
                    },
                },
            },
        });

        // Medidores nos contratos
        const contractIds = userContracts.map(uc => uc.contractId);
        const devices = await prisma.measurementDevice.findMany({
            where: {
                contractId: { in: contractIds },
                active: true,
            },
            include: {
                contract: { select: { name: true } },
            },
        });

        // Assets nos contratos
        const assets = await prisma.asset.findMany({
            where: {
                contractId: { in: contractIds },
                active: true,
                deletedAt: null,
            },
            include: {
                contract: { select: { name: true } },
            },
            take: 10,
        });

        // Minhas medições
        const myEntries = await prisma.measurementEntry.findMany({
            where: { userId: session.user.id },
            include: {
                device: {
                    select: {
                        name: true,
                        contract: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
        });

        return NextResponse.json({
            user,
            contratos_associados: userContracts.length,
            contratos: userContracts.map(uc => uc.contract),
            medidores_disponiveis: devices.length,
            medidores: devices,
            equipamentos_disponiveis: assets.length,
            equipamentos: assets.slice(0, 5),
            minhas_leituras: myEntries.length,
            leituras: myEntries,
        });
    } catch (error) {
        console.error("[DEBUG_TECHNICIAN_STATUS]", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
