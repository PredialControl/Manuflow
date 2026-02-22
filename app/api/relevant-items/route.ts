import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyWhereClause } from "@/lib/multi-tenancy";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const contractId = searchParams.get("contractId");

        const companyWhere = getCompanyWhereClause(session);

        const where: any = {
            ...companyWhere,
            deletedAt: null,
        };

        // Filter by contract if specified
        if (contractId) {
            where.contractId = contractId;
        }

        const items = await prisma.relevantItem.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                contract: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                    }
                },
                attachments: {
                    include: {
                        user: {
                            select: {
                                name: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("[RELEVANT_ITEMS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { contractId, title, description, status, priority, dueDate, value, notes } = body;

        if (!contractId || !title) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const item = await prisma.relevantItem.create({
            data: {
                contractId,
                companyId: session.user.companyId,
                userId: session.user.id,
                title,
                description,
                status: status || "AWAITING_BUDGET",
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                value: value ? parseFloat(value) : null,
                notes,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                contract: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                    }
                },
                attachments: true,
            }
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("[RELEVANT_ITEMS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
