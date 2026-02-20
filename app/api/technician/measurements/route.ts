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
        // Buscar últimas 10 medições do técnico
        const entries = await prisma.measurementEntry.findMany({
            where: {
                userId: session.user.id,
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
