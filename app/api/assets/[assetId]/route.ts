import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: Request,
    { params }: { params: { assetId: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await prisma.asset.update({
            where: { id: params.assetId },
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
    { params }: { params: { assetId: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const asset = await prisma.asset.update({
            where: { id: params.assetId },
            data: body,
        });

        return NextResponse.json(asset);
    } catch (error) {
        console.error("Error updating asset:", error);
        return NextResponse.json({ message: "Erro ao atualizar ativo" }, { status: 500 });
    }
}
