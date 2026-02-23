import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyWhereClause } from "@/lib/multi-tenancy";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const contractId = searchParams.get("contractId");

        // Tenta pegar companyId da sessão, se não tiver busca do banco (segurança extra)
        let companyId = session.user.companyId;
        if (!companyId) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { companyId: true }
            });
            companyId = user?.companyId || "";
        }

        const where: any = {
            companyId,
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
                    include: { user: { select: { name: true } } },
                },
                history: {
                    include: { user: { select: { name: true } } },
                    orderBy: { createdAt: "desc" },
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

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { contractId, title, description, status, priority, dueDate, value, notes } = body;

        let companyId = session.user.companyId;
        if (!companyId) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { companyId: true }
            });
            companyId = user?.companyId || "";
        }

        if (!companyId && contractId) {
            const contract = await prisma.contract.findUnique({
                where: { id: contractId },
                select: { companyId: true }
            });
            companyId = contract?.companyId || "";
        }

        if (!contractId || !title) {
            return NextResponse.json({ error: "contractId e title são obrigatórios" }, { status: 400 });
        }

        if (!companyId) {
            return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
        }

        // Valida se o userId existe no banco para evitar erro de chave estrangeira
        let userId = session.user.id;
        const userExists = await prisma.user.findUnique({ where: { id: userId } });

        if (!userExists) {
            // Em ambiente de teste/local, se o user da sessão sumiu do banco,
            // tentamos achar o primeiro admin da empresa para vincular o item
            const fallbackUser = await prisma.user.findFirst({
                where: { companyId: companyId }
            });
            if (fallbackUser) {
                userId = fallbackUser.id;
            } else {
                return NextResponse.json({ error: "Usuário criador não econtrado no banco" }, { status: 400 });
            }
        }

        const item = await prisma.relevantItem.create({
            data: {
                contractId,
                companyId,
                userId: userId,
                title,
                description,
                status: status || "AWAITING_BUDGET",
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                value: value ? parseFloat(value) : null,
                notes,
                history: {
                    create: {
                        userId: userId,
                        newStatus: status || "AWAITING_BUDGET",
                    }
                }
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                contract: { select: { id: true, name: true, company: true } },
                attachments: true,
            }
        });

        return NextResponse.json(item);

        console.log("[RELEVANT_ITEMS_POST] criado:", item.id);
        return NextResponse.json(item);
    } catch (error: any) {
        console.error("[RELEVANT_ITEMS_POST] ERRO:", error);
        return NextResponse.json(
            { error: error?.message ?? "Erro interno" },
            { status: 500 }
        );
    }
}
