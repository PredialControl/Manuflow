import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        let companyId = session.user.companyId;
        if (!companyId) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { companyId: true }
            });
            companyId = user?.companyId || "";
        }

        const call = await (prisma as any).serviceCall.findFirst({
            where: { id: params.id, companyId, deletedAt: null },
            include: {
                openedBy: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true, category: true } },
                contract: { select: { id: true, name: true, company: true } },
                asset: { select: { id: true, name: true, type: true, location: true } },
            }
        });

        if (!call) {
            return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 });
        }

        return NextResponse.json(call);
    } catch (error) {
        console.error("[CHAMADO_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, description, priority, status, assignedToId, resolution, notes } = body;

        let companyId = session.user.companyId;
        if (!companyId) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { companyId: true }
            });
            companyId = user?.companyId || "";
        }

        const existing = await (prisma as any).serviceCall.findFirst({
            where: { id: params.id, companyId, deletedAt: null }
        });

        if (!existing) {
            return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 });
        }

        // Calcula datas automáticas conforme status
        const updateData: any = {
            title: title ?? existing.title,
            description: description ?? existing.description,
            priority: priority ?? existing.priority,
            status: status ?? existing.status,
            assignedToId: assignedToId !== undefined ? (assignedToId || null) : existing.assignedToId,
            resolution: resolution ?? existing.resolution,
            notes: notes ?? existing.notes,
            updatedAt: new Date(),
        };

        if (status === "IN_PROGRESS" && !existing.startedAt) {
            updateData.startedAt = new Date();
        }
        if (status === "COMPLETED" && !existing.completedAt) {
            updateData.completedAt = new Date();
        }

        const call = await (prisma as any).serviceCall.update({
            where: { id: params.id },
            data: updateData,
            include: {
                openedBy: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } },
                contract: { select: { id: true, name: true, company: true } },
                asset: { select: { id: true, name: true, type: true, location: true } },
            }
        });

        return NextResponse.json(call);
    } catch (error: any) {
        console.error("[CHAMADO_PUT]", error);
        return NextResponse.json({ error: error?.message ?? "Erro interno" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Apenas ADMIN e OWNER podem deletar
    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(session.user.role)) {
        return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    try {
        let companyId = session.user.companyId;
        if (!companyId) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { companyId: true }
            });
            companyId = user?.companyId || "";
        }

        await (prisma as any).serviceCall.update({
            where: { id: params.id },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[CHAMADO_DELETE]", error);
        return NextResponse.json({ error: error?.message ?? "Erro interno" }, { status: 500 });
    }
}
