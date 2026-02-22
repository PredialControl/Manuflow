import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDirectCompanyWhereClause } from "@/lib/multi-tenancy";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const companyWhere = getDirectCompanyWhereClause(session);

        // Buscar últimas 10 medições do técnico
        const entries = await prisma.measurementEntry.findMany({
            where: {
                userId: session.user.id,
                ...companyWhere,
            },
            include: {
                device: {
                    select: {
                        name: true,
                        type: true,
                        unit: true,
                        contract: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 10,
        });

        return NextResponse.json(entries);
    } catch (error) {
        console.error("[TECHNICIAN_MEASUREMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
