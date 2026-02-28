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

        // Contar quantos reports existem nesta coluna usando $queryRaw para evitar problemas com enum
        const reportsCountResult = await prisma.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(*) as count
            FROM "Report"
            WHERE "companyId" = ${companyId}
            AND "status" = ${column.statusKey}
        `;

        const reportsCount = Number(reportsCountResult[0]?.count || 0);

        // Deletar a coluna
        await prisma.reportColumn.delete({
            where: { id },
        });

        // Se existem reports nesta coluna, movê-los para "IN_PROGRESS" usando $executeRaw
        if (reportsCount > 0) {
            await prisma.$executeRaw`
                UPDATE "Report"
                SET "status" = 'IN_PROGRESS'
                WHERE "companyId" = ${companyId}
                AND "status" = ${column.statusKey}
            `;
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
