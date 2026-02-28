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
        const { fromFloor, toFloor } = await req.json();

        // Validar
        if (typeof fromFloor !== "number" || typeof toFloor !== "number") {
            return NextResponse.json({ error: "Invalid floor numbers" }, { status: 400 });
        }

        if (fromFloor > toFloor) {
            return NextResponse.json({ error: "fromFloor must be <= toFloor" }, { status: 400 });
        }

        // Buscar prédio para validar permissão
        const building = await prisma.building.findUnique({
            where: { id },
            select: { companyId: true },
        });

        if (!building || building.companyId !== session.user.companyId) {
            return NextResponse.json({ error: "Building not found" }, { status: 404 });
        }

        // Criar andares em batch
        const floorsToCreate = [];
        for (let i = fromFloor; i <= toFloor; i++) {
            floorsToCreate.push({
                buildingId: id,
                companyId: session.user.companyId,
                number: i,
            });
        }

        // Usar createMany com skipDuplicates para evitar conflitos
        const result = await prisma.floor.createMany({
            data: floorsToCreate,
            skipDuplicates: true,
        });

        // Buscar os andares criados para retornar
        const createdFloors = await prisma.floor.findMany({
            where: {
                buildingId: id,
                number: {
                    gte: fromFloor,
                    lte: toFloor,
                },
            },
            include: {
                locations: true,
            },
            orderBy: { number: "asc" },
        });

        console.log(`[FLOORS_CREATE] User ${session.user.name} created ${result.count} floors (${fromFloor} to ${toFloor}) in building ${id}`);

        return NextResponse.json(createdFloors);
    } catch (error: any) {
        console.error("[FLOORS_CREATE] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
