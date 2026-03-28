import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChamadosKanban } from "@/components/chamados-kanban";
import { TechnicianChamadosList } from "@/components/technician-chamados-list";

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
    const isTechnician = session.user.role === "TECHNICIAN";

    return (
        <div className="space-y-8 animate-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase">
                        Chamados
                    </h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        {isTechnician ? "Meus chamados atribuídos" : "Gestão de ordens de serviço"}
                    </p>
                </div>
            </div>

            {isTechnician ? (
                <TechnicianChamadosList />
            ) : (
                <ChamadosKanban
                    contractId={params.contractId}
                    showNewButton={true}
                    role={session.user.role}
                />
            )}
        </div>
    );
}
