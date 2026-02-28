import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const { name, description } = await req.json();

        const building = await prisma.building.create({
            data: {
                contractId: id,
                companyId: session.user.companyId,
                name,
                description,
            },
        });

        console.log(`[BUILDING_CREATE] User ${session.user.name} created building ${name} in contract ${id}`);

        return NextResponse.json(building);
    } catch (error: any) {
        console.error("[BUILDING_CREATE] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
