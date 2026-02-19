import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { value, notes, photo } = await req.json();

        const entry = await prisma.measurementEntry.create({
            data: {
                deviceId: params.id,
                userId: session.user.id,
                value: parseFloat(value),
                notes,
                photo,
            },
            include: {
                user: { select: { name: true } }
            }
        });

        return NextResponse.json(entry);
    } catch (error) {
        console.error("[ENTRIES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
