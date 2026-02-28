import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    MapPin,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    FileText,
    Wrench,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Image from "next/image";

export default async function PublicAssetPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // Buscar ativo com informações públicas
    const asset = await prisma.asset.findUnique({
        where: { id },
        include: {
            contract: {
                select: {
                    name: true,
                    company: true,
                },
            },
            inspections: {
                where: { status: "COMPLETED" },
                orderBy: { completedAt: "desc" },
                take: 1,
                include: {
                    user: {
                        select: { name: true },
                    },
                },
            },
        },
    });

    if (!asset) {
        notFound();
    }

    const lastInspection = asset.inspections[0];

    const statusConfig = {
        OPERATIONAL: {
            label: "Operacional",
            color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
            icon: CheckCircle2,
        },
        MAINTENANCE: {
            label: "Em Manutenção",
            color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
            icon: Wrench,
        },
        NOT_OPERATIONAL: {
            label: "Parado",
            color: "bg-red-500/10 text-red-600 border-red-500/20",
            icon: XCircle,
        },
    };

    const currentStatus = statusConfig[asset.operationalStatus || "OPERATIONAL"];
    const StatusIcon = currentStatus.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-4 py-8">
                    <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest text-primary">
                            Informações do Ativo
                        </span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter">{asset.name}</h1>
                    <p className="text-lg text-muted-foreground font-medium">
                        {asset.contract.company}
                    </p>
                </div>

                {/* Status Card */}
                <Card className="card-premium border-2">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${currentStatus.color}`}>
                                    <StatusIcon className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                        Status Atual
                                    </p>
                                    <p className="text-2xl font-black tracking-tight">
                                        {currentStatus.label}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                    Código
                                </p>
                                <p className="text-xl font-black text-primary">
                                    #{asset.id.slice(-8).toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Location */}
                    <Card className="card-premium">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                Localização
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-bold">{asset.location || "Não especificada"}</p>
                        </CardContent>
                    </Card>

                    {/* Contract */}
                    <Card className="card-premium">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Contrato
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-bold">{asset.contract.name}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Last Inspection */}
                {lastInspection && (
                    <Card className="card-premium border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                Última Vistoria
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                                        Data
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-lg font-bold">
                                            {formatDate(lastInspection.completedAt!)}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                                        Responsável
                                    </p>
                                    <p className="text-lg font-bold">{lastInspection.user.name}</p>
                                </div>
                            </div>

                            {lastInspection.notes && (
                                <div className="p-4 bg-muted/30 rounded-xl border border-border/40">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                                        Observações
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {lastInspection.notes}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Footer */}
                <div className="text-center py-8 text-xs text-muted-foreground">
                    <p className="font-bold">
                        Informações atualizadas em tempo real
                    </p>
                    <p className="mt-1 opacity-60">
                        Última atualização: {formatDate(new Date())}
                    </p>
                </div>
            </div>
        </div>
    );
}
