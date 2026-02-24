import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: reportId } = await params;

        // Fetch report with history
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: {
                contract: { select: { id: true, name: true } },
                asset: { select: { id: true, name: true } },
                user: { select: { name: true, email: true } },
            },
        });

        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        // Fetch audit logs for this report (history)
        const history = await prisma.auditLog.findMany({
            where: {
                entity: "Report",
                entityId: reportId,
                action: "UPDATE_REPORT_STATUS",
            },
            include: {
                user: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // Transform history to match frontend format
        const transformedHistory = history.map((log) => ({
            id: log.id,
            oldStatus: (log.changes as any)?.from || null,
            newStatus: (log.changes as any)?.to,
            createdAt: log.createdAt,
            user: log.user,
        }));

        return NextResponse.json({
            ...report,
            history: transformedHistory,
        });
    } catch (error) {
        console.error("Error fetching report:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
