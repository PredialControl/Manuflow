import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { BuildingHierarchyManager } from "@/components/building-hierarchy-manager";

export default async function StructurePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const { id } = await params;

    // Buscar contrato com prédios, andares e locais
    const contract = await prisma.contract.findUnique({
        where: { id },
        include: {
            buildings: {
                where: { active: true },
                include: {
                    floors: {
                        where: { active: true },
                        include: {
                            locations: {
                                where: { active: true },
                                include: {
                                    assets: {
                                        where: { active: true },
                                        select: {
                                            id: true,
                                            name: true,
                                            type: true,
                                            operationalStatus: true,
                                        },
                                    },
                                },
                                orderBy: { name: "asc" },
                            },
                        },
                        orderBy: { number: "desc" },
                    },
                },
                orderBy: { name: "asc" },
            },
        },
    });

    if (!contract) {
        notFound();
    }

    // Verificar permissão
    const isAdmin = ["ADMIN", "OWNER"].includes(session.user.role);

    return (
        <div className="space-y-8 animate-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase">
                        Estrutura do Contrato
                    </h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        {contract.name} - Gerenciamento de Prédios, Andares e Locais
                    </p>
                </div>
            </div>

            <BuildingHierarchyManager
                contractId={contract.id}
                buildings={contract.buildings as any}
                isAdmin={isAdmin}
            />
        </div>
    );
}
