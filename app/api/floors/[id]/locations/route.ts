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

        // Buscar andar para validar permissão
        const floor = await prisma.floor.findUnique({
            where: { id },
            select: { companyId: true, number: true },
        });

        if (!floor || floor.companyId !== session.user.companyId) {
            return NextResponse.json({ error: "Floor not found" }, { status: 404 });
        }

        const location = await prisma.location.create({
            data: {
                floorId: id,
                companyId: session.user.companyId,
                name,
                description,
            },
        });

        console.log(`[LOCATION_CREATE] User ${session.user.name} created location ${name} on floor ${floor.number}`);

        return NextResponse.json(location);
    } catch (error: any) {
        console.error("[LOCATION_CREATE] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
