import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

        console.log(`[DELETE COLUMN] Starting deletion for column ID: ${id}`);

        // Buscar a coluna
        const column = await prisma.reportColumn.findUnique({
            where: { id },
        });

        if (!column) {
            console.log(`[DELETE COLUMN] Column not found: ${id}`);
            return NextResponse.json(
                { error: "Column not found" },
                { status: 404 }
            );
        }

        // Verificar se pertence à empresa
        if (column.companyId !== companyId) {
            console.log(`[DELETE COLUMN] Column belongs to another company`);
            return NextResponse.json(
                { error: "Forbidden - Column belongs to another company" },
                { status: 403 }
            );
        }

        console.log(`[DELETE COLUMN] Deleting column: ${column.title} (${column.statusKey})`);

        // IMPORTANTE: Primeiro mover os reports, DEPOIS deletar a coluna
        // Usar raw SQL com Prisma.sql para garantir que funcione
        const reportsCountResult = await prisma.$queryRaw<Array<{ count: bigint }>>(
            Prisma.sql`SELECT COUNT(*) as count FROM "Report" WHERE "companyId" = ${companyId} AND CAST("status" AS TEXT) = ${column.statusKey}`
        );

        const reportsCount = Number(reportsCountResult[0]?.count || 0);
        console.log(`[DELETE COLUMN] Found ${reportsCount} reports in column ${column.statusKey}`);

        // Se existem reports nesta coluna, movê-los para "IN_PROGRESS" ANTES de deletar a coluna
        if (reportsCount > 0) {
            console.log(`[DELETE COLUMN] Moving ${reportsCount} reports to IN_PROGRESS`);

            // Usar updateMany com unsafe casting
            const updated = await prisma.$executeRaw(
                Prisma.sql`UPDATE "Report" SET "status" = CAST('IN_PROGRESS' AS "ReportStatus") WHERE "companyId" = ${companyId} AND CAST("status" AS TEXT) = ${column.statusKey}`
            );

            console.log(`[DELETE COLUMN] Updated ${updated} reports`);
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
        console.error("[DELETE COLUMN] Error stack:", error.stack);
        console.error("[DELETE COLUMN] Error details:", {
            message: error.message,
            code: error.code,
            meta: error.meta,
        });
        return NextResponse.json(
            {
                error: "Failed to delete column",
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}
