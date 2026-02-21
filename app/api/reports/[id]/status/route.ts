import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: reportId } = await params;
        const { status } = await req.json();

        if (!status) {
            return NextResponse.json(
                { error: "Status is required" },
                { status: 400 }
            );
        }

        // Verify user has access to this report
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: {
                contract: {
                    include: {
                        users: true,
                    },
                },
            },
        });

        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        // Check permissions
        const hasAccess =
            session.user.role === "ADMIN" ||
            report.contract.users.some((uc) => uc.userId === session.user.id);

        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Update report status
        const updatedReport = await prisma.report.update({
            where: { id: reportId },
            data: { status },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "UPDATE_REPORT_STATUS",
                entity: "Report",
                entityId: reportId,
                changes: {
                    from: report.status,
                    to: status,
                },
            },
        });

        return NextResponse.json(updatedReport);
    } catch (error) {
        console.error("Error updating report status:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
