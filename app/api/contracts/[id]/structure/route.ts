import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const floors = await prisma.floor.findMany({
            where: {
                contractId: id,
                companyId: session.user.companyId,
                active: true,
            },
            include: {
                locations: {
                    where: { active: true },
                    include: {
                        assets: {
                            where: { active: true },
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                operationalStatus: true,
                            },
                        },
                    },
                    orderBy: { name: "asc" },
                },
            },
            orderBy: { number: "desc" },
        });

        return NextResponse.json({ floors });
    } catch (error) {
        console.error("Error fetching structure:", error);
        return NextResponse.json(
            { error: "Failed to fetch structure" },
            { status: 500 }
        );
    }
}
