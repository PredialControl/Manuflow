import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: contractId } = await params;
        const { fromFloor, toFloor } = await req.json();

        if (fromFloor === undefined || toFloor === undefined) {
            return NextResponse.json(
                { error: "fromFloor and toFloor are required" },
                { status: 400 }
            );
        }

        const from = parseInt(fromFloor);
        const to = parseInt(toFloor);

        if (isNaN(from) || isNaN(to)) {
            return NextResponse.json(
                { error: "fromFloor and toFloor must be valid numbers" },
                { status: 400 }
            );
        }

        // Create floors in range
        const floorsToCreate = [];
        for (let i = from; i <= to; i++) {
            floorsToCreate.push({
                contractId,
                companyId: session.user.companyId,
                number: i,
            });
        }

        await prisma.floor.createMany({
            data: floorsToCreate,
            skipDuplicates: true,
        });

        return NextResponse.json({ success: true, count: floorsToCreate.length });
    } catch (error) {
        console.error("Error creating floors:", error);
        return NextResponse.json(
            { error: "Failed to create floors" },
            { status: 500 }
        );
    }
}
