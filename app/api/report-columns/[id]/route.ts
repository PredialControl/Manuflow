import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE - Deletar coluna customizada
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Apenas OWNER e ADMIN podem deletar colunas
        const userRole = session.user.role;
        if (userRole !== "OWNER" && userRole !== "ADMIN") {
            return NextResponse.json(
                { error: "Forbidden - Only OWNER/ADMIN can delete columns" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const companyId = session.user.companyId;

        // Buscar a coluna
        const column = await prisma.reportColumn.findUnique({
            where: { id },
        });

        if (!column) {
            return NextResponse.json(
                { error: "Column not found" },
                { status: 404 }
            );
        }

        // Verificar se pertence à empresa
        if (column.companyId !== companyId) {
            return NextResponse.json(
                { error: "Forbidden - Column belongs to another company" },
                { status: 403 }
            );
        }

        // Não permitir deletar colunas padrão
        if (column.isDefault) {
            return NextResponse.json(
                { error: "Cannot delete default columns" },
                { status: 400 }
            );
        }

        // Contar quantos reports existem nesta coluna
        const reportsCount = await prisma.report.count({
            where: {
                companyId,
                status: column.statusKey as any,
            },
        });

        // Deletar a coluna
        await prisma.reportColumn.delete({
            where: { id },
        });

        // Se existem reports nesta coluna, movê-los para "IN_PROGRESS"
        if (reportsCount > 0) {
            await prisma.report.updateMany({
                where: {
                    companyId,
                    status: column.statusKey as any,
                },
                data: {
                    status: "IN_PROGRESS" as any,
                },
            });
        }

        return NextResponse.json({
            message: "Column deleted successfully",
            reportsAffected: reportsCount,
        });
    } catch (error) {
        console.error("Error deleting report column:", error);
        return NextResponse.json(
            { error: "Failed to delete column" },
            { status: 500 }
        );
    }
}
