import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id: contractId } = await params;
        const { name, type, unit, serialNumber } = await req.json();

        const device = await prisma.measurementDevice.create({
            data: {
                contractId,
                name,
                type,
                unit,
                serialNumber,
            },
            include: {
                entries: {
                    orderBy: { date: "desc" },
                    take: 5,
                    include: { user: { select: { name: true } } }
                }
            }
        });

        return NextResponse.json(device);
    } catch (error) {
        console.error("[DEVICES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
