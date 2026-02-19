import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Gauge, History, Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

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

    const contracts = await prisma.contract.findMany({
        where: {
            ...whereClause,
            active: true,
            deletedAt: null,
        },
        include: {
            _count: {
                select: { measurementDevices: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-foreground">Medições</h1>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">
                    Gestão de Consumo de Água, Energia e Gás
                </p>
            </div>

            <Card className="card-premium border-none bg-primary/5">
                <CardContent className="p-6">
                    <div className="relative group max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Buscar por contrato ou cliente..."
                            className="pl-11 h-12 bg-background border-border/40 rounded-2xl focus-visible:ring-primary/20"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {contracts.map((contract: any) => (
                    <Link key={contract.id} href={`/contracts/${contract.id}?tab=measurements`}>
                        <Card className="card-premium h-full hover:border-primary/40 transition-all group">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors">
                                        <Gauge className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="font-black tracking-tight text-lg group-hover:text-primary transition-colors">
                                            {contract.name}
                                        </h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                            {contract.company}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                                    <div className="flex items-center gap-2">
                                        <History className="h-4 w-4 text-muted-foreground/40" />
                                        <span className="text-xs font-bold text-muted-foreground">
                                            {contract._count.measurementDevices} medidores vinculados
                                        </span>
                                    </div>
                                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                                        <Search className="h-4 w-4 text-muted-foreground/60" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
