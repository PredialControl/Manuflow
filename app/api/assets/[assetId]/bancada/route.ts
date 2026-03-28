import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/assets/[assetId]/bancada — atualiza status de bancada externa
export async function PUT(
    req: Request,
    { params }: { params: { assetId: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!["ADMIN", "OWNER", "SUPERVISOR", "SUPER_ADMIN"].includes(session.user.role)) {
        return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const {
            isInExternalMaintenance,
            externalCompany,
            externalMaintenanceSince,
            expectedReturnDate,
            externalMaintenanceNotes
        } = body;

        let companyId = session.user.companyId;
        if (!companyId) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { companyId: true }
            });
            companyId = user?.companyId || "";
        }

        // Verifica se o ativo pertence à empresa
        const asset = await prisma.asset.findFirst({
            where: { id: params.assetId, companyId, active: true }
        });

        if (!asset) {
            return NextResponse.json({ error: "Ativo não encontrado" }, { status: 404 });
        }

        const updateData: any = {
            isInExternalMaintenance: !!isInExternalMaintenance,
            updatedAt: new Date(),
        };

        if (isInExternalMaintenance) {
            updateData.externalCompany = externalCompany || null;
            updateData.externalMaintenanceSince = externalMaintenanceSince
                ? new Date(externalMaintenanceSince)
                : new Date();
            updateData.expectedReturnDate = expectedReturnDate
                ? new Date(expectedReturnDate)
                : null;
            updateData.externalMaintenanceNotes = externalMaintenanceNotes || null;
            // Também atualiza status operacional
            updateData.operationalStatus = "MAINTENANCE";
        } else {
            // Limpa os dados ao retornar da bancada
            updateData.externalCompany = null;
            updateData.externalMaintenanceSince = null;
            updateData.expectedReturnDate = null;
            updateData.externalMaintenanceNotes = null;
            updateData.operationalStatus = "OPERATIONAL";
        }

        const updated = await prisma.asset.update({
            where: { id: params.assetId },
            data: updateData,
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("[ASSET_BANCADA_PUT]", error);
        return NextResponse.json({ error: error?.message ?? "Erro interno" }, { status: 500 });
    }
}
