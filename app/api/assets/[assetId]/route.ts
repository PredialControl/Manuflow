import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ assetId: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { assetId } = await params;
        const asset = await (prisma as any).asset.findUnique({
            where: { id: assetId },
            select: {
                id: true,
                name: true,
                type: true,
                location: true,
                locationId: true,
                brand: true,
                model: true,
                power: true,
                category: true,
                frequency: true,
                operationalStatus: true,
                image: true,
                serialNumber: true,
                installationDate: true,
                warrantyExpiry: true,
                isInExternalMaintenance: true,
                externalCompany: true,
                externalMaintenanceSince: true,
                expectedReturnDate: true,
                externalMaintenanceNotes: true,
            },
        });

        if (!asset) {
            return NextResponse.json({ message: "Ativo não encontrado" }, { status: 404 });
        }

        return NextResponse.json(asset);
    } catch (error) {
        console.error("Error fetching asset:", error);
        return NextResponse.json({ message: "Erro ao buscar ativo" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ assetId: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "OWNER", "SUPERVISOR"].includes(session.user.role)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { assetId } = await params;
        const body = await request.json();

        // Campos permitidos via PUT (inclui garantia)
        const allowedFields: any = {};
        if (body.installationDate !== undefined) {
            allowedFields.installationDate = body.installationDate ? new Date(body.installationDate) : null;
        }
        if (body.warrantyExpiry !== undefined) {
            allowedFields.warrantyExpiry = body.warrantyExpiry ? new Date(body.warrantyExpiry) : null;
        }

        const asset = await prisma.asset.update({
            where: { id: assetId },
            data: { ...allowedFields, updatedAt: new Date() },
        });

        return NextResponse.json(asset);
    } catch (error: any) {
        console.error("[ASSET_PUT]", error);
        return NextResponse.json({ message: error?.message || "Erro ao atualizar ativo" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ assetId: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { assetId } = await params;
        await prisma.asset.update({
            where: { id: assetId },
            data: {
                deletedAt: new Date(),
                active: false
            },
        });

        return NextResponse.json({ message: "Ativo apagado com sucesso" });
    } catch (error) {
        console.error("Error deleting asset:", error);
        return NextResponse.json({ message: "Erro ao apagar ativo" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ assetId: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { assetId } = await params;
        const body = await request.json();

        console.log('[ASSET_UPDATE] Updating asset:', assetId);
        console.log('[ASSET_UPDATE] Image present:', !!body.image, 'Length:', body.image?.length || 0);

        const asset = await prisma.asset.update({
            where: { id: assetId },
            data: body,
        });

        console.log('[ASSET_UPDATE] Asset updated successfully');
        return NextResponse.json(asset);
    } catch (error: any) {
        console.error("[ASSET_UPDATE] Error:", error);
        console.error("[ASSET_UPDATE] Error message:", error?.message);
        return NextResponse.json({ message: error?.message || "Erro ao atualizar ativo" }, { status: 500 });
    }
}
