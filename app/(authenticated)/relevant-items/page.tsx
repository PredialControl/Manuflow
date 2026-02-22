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
    searchParams: { contractId?: string };
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const companyWhereClause = getCompanyWhereClause(session);

    const where: any = {
        ...companyWhereClause,
        deletedAt: null,
    };

    // Filter by contract if specified
    if (searchParams.contractId) {
        where.contractId = searchParams.contractId;
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

    return (
        <div className="container mx-auto p-6">
            <RelevantItemsKanban
                initialItems={items as any}
                contractId={searchParams.contractId}
            />
        </div>
    );
}
