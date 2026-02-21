import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SupervisorMeasurementsDashboard } from "@/components/supervisor-measurements-dashboard";

export default async function MeasurementsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const whereClause = (session.user.role === "ADMIN" || session.user.role === "OWNER")
        ? {}
        : {
            users: {
                some: { userId: session.user.id }
            }
        };

    // ADMIN, OWNER e SUPERVISOR veem dashboard com gráficos
    const devices = await prisma.measurementDevice.findMany({
        where: {
            contract: {
                ...whereClause,
                active: true,
                deletedAt: null,
            },
            active: true,
        },
        include: {
            entries: {
                include: {
                    user: {
                        select: { name: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 15,
            },
            contract: {
                select: {
                    id: true,
                    name: true,
                    company: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-foreground">Dashboard de Medições</h1>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">
                    Análise e Histórico de Consumo
                </p>
            </div>

            <SupervisorMeasurementsDashboard devices={devices as any} />
        </div>
    );
}
