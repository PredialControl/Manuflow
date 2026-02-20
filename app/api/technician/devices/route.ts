import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // Buscar contratos do técnico
        const userContracts = await prisma.userContract.findMany({
            where: { userId: session.user.id },
            select: { contractId: true },
        });

        const contractIds = userContracts.map(uc => uc.contractId);

        // Se OWNER/ADMIN sem contratos, pega todos
        const effectiveContractIds = ((session.user.role === "ADMIN" || session.user.role === "OWNER") && contractIds.length === 0)
            ? (await prisma.contract.findMany({ where: { active: true }, select: { id: true } })).map(c => c.id)
            : contractIds;

        // Buscar todos os medidores dos contratos do técnico
        const devices = await prisma.measurementDevice.findMany({
            where: {
                contractId: { in: effectiveContractIds },
                active: true,
            },
            include: {
                contract: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                entries: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: {
                        value: true,
                        createdAt: true,
                        user: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(devices);
    } catch (error) {
        console.error("[TECHNICIAN_DEVICES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
