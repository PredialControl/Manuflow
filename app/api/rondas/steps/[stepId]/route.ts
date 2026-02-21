import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ stepId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const { stepId } = await params;
        const body = await request.json();
        const { status, notes, photoUrl } = body;

        const step = await prisma.scheduledInspectionStep.update({
            where: { id: stepId },
            data: {
                status,
                notes,
                photoUrl,
                completedAt: status !== "PENDING" ? new Date() : null,
            },
        });

        return NextResponse.json(step);
    } catch (error) {
        console.error("Error updating step:", error);
        return NextResponse.json({ message: "Erro ao atualizar passo" }, { status: 500 });
    }
}
