import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyWhereClause } from "@/lib/multi-tenancy";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const contractId = searchParams.get("contractId");
        const assetId = searchParams.get("assetId");
        const status = searchParams.get("status");
        const assignedToMe = searchParams.get("assignedToMe") === "true";

        let companyId = session.user.companyId;
        if (!companyId) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { companyId: true }
            });
            companyId = user?.companyId || "";
        }

        const where: any = {
            companyId,
            deletedAt: null,
        };

        if (contractId) where.contractId = contractId;
        if (assetId) where.assetId = assetId;
        if (status) where.status = status;

        // Técnico vê apenas chamados atribuídos a ele
        if (session.user.role === "TECHNICIAN" || assignedToMe) {
            where.assignedToId = session.user.id;
        }

        const calls = await (prisma as any).serviceCall.findMany({
            where,
            include: {
                openedBy: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true, category: true } },
                contract: { select: { id: true, name: true, company: true } },
                asset: { select: { id: true, name: true, type: true, location: true } },
            },
            orderBy: [
                { status: "asc" },
                { createdAt: "desc" }
            ]
        });

        return NextResponse.json(calls);
    } catch (error) {
        console.error("[CHAMADOS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { contractId, assetId, title, description, priority, assignedToId, notes } = body;

        if (!contractId || !title) {
            return NextResponse.json({ error: "contractId e title são obrigatórios" }, { status: 400 });
        }

        let companyId = session.user.companyId;
        if (!companyId) {
            const contract = await prisma.contract.findUnique({
                where: { id: contractId },
                select: { companyId: true }
            });
            companyId = contract?.companyId || "";
        }

        if (!companyId) {
            return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
        }

        const call = await (prisma as any).serviceCall.create({
            data: {
                companyId,
                contractId,
                assetId: assetId || null,
                openedById: session.user.id,
                assignedToId: assignedToId || null,
                title,
                description: description || null,
                priority: priority || "MEDIUM",
                status: "OPEN",
                notes: notes || null,
            },
            include: {
                openedBy: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } },
                contract: { select: { id: true, name: true, company: true } },
                asset: { select: { id: true, name: true, type: true, location: true } },
            }
        });

        return NextResponse.json(call);
    } catch (error: any) {
        console.error("[CHAMADOS_POST]", error);
        return NextResponse.json({ error: error?.message ?? "Erro interno" }, { status: 500 });
    }
}
