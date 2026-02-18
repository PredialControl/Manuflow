import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/schedules?contractId=xxx
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId");

    const schedules = await prisma.inspectionSchedule.findMany({
        where: {
            ...(contractId ? { contractId } : {}),
            active: true,
        },
        include: {
            contract: { select: { name: true } },
            _count: { select: { occurrences: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(schedules);
}

// POST /api/schedules
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contractId, name, description, days, shift, time } = body;

    if (!contractId || !name || !days?.length || !time) {
        return NextResponse.json({ message: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const schedule = await prisma.inspectionSchedule.create({
        data: { contractId, name, description, days, shift: shift || "DAY", time },
    });

    return NextResponse.json(schedule, { status: 201 });
}
