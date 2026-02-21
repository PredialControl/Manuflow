import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/rondas/[id] — Atualizar status da ronda (iniciar / concluir)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const data: any = { status, notes };
    if (status === "IN_PROGRESS") data.startedAt = new Date();
    if (status === "COMPLETED") data.completedAt = new Date();

    const inspection = await prisma.scheduledInspection.update({
        where: { id },
        data,
        include: {
            schedule: { select: { name: true, shift: true, time: true } },
            contract: { select: { name: true } },
        },
    });

    return NextResponse.json(inspection);
}
