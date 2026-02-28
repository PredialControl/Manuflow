import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RelevantItemsKanban } from "@/components/relevant-items-kanban";
import { getCompanyWhereClause, isCompanyAdmin } from "@/lib/multi-tenancy";

export const dynamic = "force-dynamic";

export default async function RelevantItemsPage({
    searchParams,
}: {
    searchParams: Promise<{ contractId?: string }>;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const params = await searchParams;
    const companyWhereClause = getCompanyWhereClause(session);

    const where: any = {
        ...companyWhereClause,
        deletedAt: null,
    };

    // Filter by contract if specified
    if (params.contractId) {
        where.contractId = params.contractId;
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
                },
                orderBy: {
                    createdAt: "desc"
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    // Buscar contratos para o filtro
    const contracts = await prisma.contract.findMany({
        where: {
            ...companyWhereClause,
            active: true,
            deletedAt: null,
        },
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            name: "asc"
        }
    });

    return (
        <div className="space-y-8 animate-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase">
                        Itens / Orçamentos
                    </h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        {params.contractId ? `Filtrado por contrato` : "Todos os contratos"}
                    </p>
                </div>
            </div>

            <RelevantItemsKanban
                initialItems={items as any}
                contractId={params.contractId}
                contracts={contracts}
            />
        </div>
    );
}
