import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { id: contractId } = await params;
    const devices = await prisma.measurementDevice.findMany({
        where: { contractId, companyId: session.user.companyId, active: true },
        include: {
            entries: {
                orderBy: { date: "desc" },
                take: 1,
                include: { user: { select: { name: true } } }
            }
        },
        orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(devices);
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { id: contractId } = await params;
        const { name, type, unit, serialNumber } = await req.json();

        const device = await prisma.measurementDevice.create({
            data: {
                companyId: session.user.companyId,
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

// DELETE ?deviceId=xxx — admin/owner only
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const deviceId = url.searchParams.get("deviceId");
        if (!deviceId) return NextResponse.json({ error: "deviceId required" }, { status: 400 });

        await prisma.measurementDevice.update({
            where: { id: deviceId },
            data: { active: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[DEVICES_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
