import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { title, description, status, priority, dueDate, value, notes } = body;

        const item = await prisma.relevantItem.update({
            where: { id },
            data: {
                title,
                description,
                status,
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
                attachments: {
                    include: {
                        user: {
                            select: {
                                name: true,
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("[RELEVANT_ITEM_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;

        // Soft delete
        await prisma.relevantItem.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[RELEVANT_ITEM_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
