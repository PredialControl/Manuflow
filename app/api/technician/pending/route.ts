import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get contracts assigned to the user
    const userContracts = await prisma.userContract.findMany({
        where: { userId: session.user.id },
        select: { contractId: true },
    });

    const contractIds = userContracts.map(uc => uc.contractId);

    // If OWNER/ADMIN and no contracts assigned, get all contracts
    const effectiveContractIds = ((session.user.role === "ADMIN" || session.user.role === "OWNER") && contractIds.length === 0)
        ? (await prisma.contract.findMany({ where: { active: true }, select: { id: true } })).map(c => c.id)
        : contractIds;

    // Get all assets for these contracts
    const assets = await prisma.asset.findMany({
        where: {
            contractId: { in: effectiveContractIds },
            active: true,
            deletedAt: null,
            // Filter by category if user has one
            ...((session.user as any).category ? { category: (session.user as any).category } : {}),
        },
        include: {
            contract: { select: { name: true } },
            inspections: {
                where: {
                    createdAt: {
                        gte: startOfDay(new Date()),
                        lte: endOfDay(new Date()),
                    },
                    status: "COMPLETED",
                },
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
        orderBy: { name: "asc" },
    });

    // Map to include status
    const rounds = assets.map(asset => ({
        id: asset.id,
        name: asset.name,
        type: asset.type,
        location: asset.location,
        contractName: asset.contract.name,
        contractId: asset.contractId,
        lastInspection: asset.inspections[0] || null,
        isDoneToday: asset.inspections.length > 0,
        frequency: asset.frequency,
    }));

    return NextResponse.json(rounds);
}
