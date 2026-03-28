import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ChamadosKanban } from "@/components/chamados-kanban";
import { getCompanyWhereClause } from "@/lib/multi-tenancy";

export const dynamic = "force-dynamic";

export default async function ChamadosPage({
    searchParams,
}: {
    searchParams: Promise<{ contractId?: string }>;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const params = await searchParams;

    return (
        <div className="space-y-8 animate-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase">
                        Chamados
                    </h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        Gestão de ordens de serviço
                    </p>
                </div>
            </div>

            <ChamadosKanban
                contractId={params.contractId}
                showNewButton={true}
                role={session.user.role}
            />
        </div>
    );
}
