import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getContractWhereClause } from "@/lib/multi-tenancy";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // Get contracts using multi-tenancy helper
        const contractWhere = getContractWhereClause(session);

        const contracts = await prisma.contract.findMany({
            where: contractWhere,
            select: { id: true },
        });

        const contractIds = contracts.map(c => c.id);

        // Buscar todos os medidores dos contratos do técnico
        const devices = await prisma.measurementDevice.findMany({
            where: {
                contractId: { in: contractIds },
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
