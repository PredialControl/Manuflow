import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: contractId } = await params;

        const technicianCount = await prisma.userContract.count({
            where: {
                contractId,
                user: {
                    role: "TECHNICIAN",
                },
            },
        });

        return NextResponse.json({ technicianCount });
    } catch (error) {
        console.error("Error counting technicians:", error);
        return NextResponse.json(
            { error: "Failed to count technicians" },
            { status: 500 }
        );
    }
}
