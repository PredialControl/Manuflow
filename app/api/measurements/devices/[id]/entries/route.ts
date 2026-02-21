import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log("[ENTRIES_POST] Handler called");

    const session = await getServerSession(authOptions);
    console.log("[ENTRIES_POST] Session:", session ? "authenticated" : "not authenticated");

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        console.log("[ENTRIES_POST] Awaiting params...");
        // Await params in Next.js 15+ / App Router
        const { id: deviceId } = await params;
        console.log("[ENTRIES_POST] Device ID:", deviceId);

        const { value, notes } = await req.json();
        console.log("[ENTRIES_POST] Request body:", { value, notes });

        // Validar valor
        const numericValue = typeof value === 'number' ? value : parseFloat(value);

        if (isNaN(numericValue)) {
            console.error("[ENTRIES_POST] Invalid value:", value);
            return new NextResponse("Invalid value", { status: 400 });
        }

        console.log("[ENTRIES_POST] Creating entry:", {
            deviceId,
            userId: session.user.id,
            value: numericValue,
            notes,
        });

        const entry = await prisma.measurementEntry.create({
            data: {
                deviceId,
                userId: session.user.id,
                value: numericValue,
                notes: notes || null,
            },
            include: {
                user: { select: { name: true } }
            }
        });

        return NextResponse.json(entry);
    } catch (error) {
        console.error("[ENTRIES_POST] Error details:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
