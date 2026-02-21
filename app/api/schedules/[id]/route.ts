import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/schedules/[id]
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, days, shift, time, active } = body;

    const schedule = await prisma.inspectionSchedule.update({
        where: { id },
        data: { name, description, days, shift, time, active },
    });

    return NextResponse.json(schedule);
}

// DELETE /api/schedules/[id]
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.inspectionSchedule.update({
        where: { id },
        data: { active: false },
    });

    return NextResponse.json({ success: true });
}
