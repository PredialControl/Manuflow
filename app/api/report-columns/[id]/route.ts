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

        console.log(`[DELETE COLUMN] Deleting column: ${column.title} (${column.statusKey})`);

        // IMPORTANTE: Primeiro mover os reports, DEPOIS deletar a coluna
        // Contar e mover reports ANTES de deletar
        const reportsCountResult = await prisma.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(*) as count
            FROM "Report"
            WHERE "companyId" = ${companyId}
            AND "status" = ${column.statusKey}
        `;

        const reportsCount = Number(reportsCountResult[0]?.count || 0);
        console.log(`[DELETE COLUMN] Found ${reportsCount} reports in column ${column.statusKey}`);

        // Se existem reports nesta coluna, movê-los para "IN_PROGRESS" ANTES de deletar a coluna
        if (reportsCount > 0) {
            console.log(`[DELETE COLUMN] Moving ${reportsCount} reports to IN_PROGRESS`);
            await prisma.$executeRaw`
                UPDATE "Report"
                SET "status" = 'IN_PROGRESS'
                WHERE "companyId" = ${companyId}
                AND "status" = ${column.statusKey}
            `;
            console.log(`[DELETE COLUMN] Reports moved successfully`);
        }

        // Agora sim, deletar a coluna
        console.log(`[DELETE COLUMN] Deleting column from database`);
        await prisma.reportColumn.delete({
            where: { id },
        });
        console.log(`[DELETE COLUMN] Column deleted successfully`);

        return NextResponse.json({
            message: "Column deleted successfully",
            reportsAffected: reportsCount,
        });
    } catch (error: any) {
        console.error("[DELETE COLUMN] Error deleting report column:", error);
        console.error("[DELETE COLUMN] Error details:", {
            message: error.message,
            code: error.code,
            meta: error.meta,
        });
        return NextResponse.json(
            {
                error: "Failed to delete column",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
