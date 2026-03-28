import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    ArrowLeft,
    Settings,
    MapPin,
    Zap,
    Calendar,
    ClipboardCheck,
    History,
    FileText,
    Plus,
    QrCode,
    Printer,
    ChevronRight,
    Package,
    Info,
    ClipboardList,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DeleteAssetButton } from "@/components/delete-asset-button";
import { QRCodeDisplay } from "@/components/qr-code-display";
import { AssetWarrantyBancada } from "@/components/asset-warranty-bancada";

export const dynamic = "force-dynamic";

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Diário",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
};

const INSPECTION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Concluída",
};

export default async function AssetDetailPage({
    params,
}: {
    params: { id: string; assetId: string };
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const asset = await (prisma as any).asset.findFirst({
        where: {
            id: params.assetId,
            contractId: params.id,
            active: true,
            deletedAt: null,
        },
        include: {
            contract: true,
            scripts: {
                orderBy: { order: "asc" },
            },
            reports: {
                where: { deletedAt: null },
                orderBy: { createdAt: "desc" },
                take: 5,
            },
            inspections: {
                where: { status: "COMPLETED" },
                orderBy: { completedAt: "desc" },
                take: 5,
                include: {
                    user: { select: { name: true } }
                }
            },
            _count: {
                select: {
                    inspections: true,
                    reports: true,
                }
            }
        },
    }) as any;

    if (!asset) {
        notFound();
    }

    // Identificador único para o QR Code (URL pública da página)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const qrCodeValue = `${baseUrl}/asset/${params.assetId}`;

    return (
        <div className="space-y-8 animate-in pb-20">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/contracts/${params.id}?tab=assets`}>
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted/50">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{asset.contract.name}</span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{asset.type}</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase italic leading-none">{asset.name}</h1>
                    </div>
                </div>

                {(session.user.role === "ADMIN" || session.user.role === "OWNER") && (
                    <div className="flex gap-2">
                        <DeleteAssetButton
                            assetId={asset.id}
                            contractId={params.id}
                            assetName={asset.name}
                        />
                        <Link href={`/contracts/${params.id}/assets/${params.assetId}/edit`}>
                            <Button variant="outline" className="rounded-xl border-border/60 font-bold uppercase tracking-widest text-[10px] h-10">
                                <Settings className="h-4 w-4 mr-2" />
                                Editar
                            </Button>
                        </Link>
                        <Link href={`/inspections/new?assetId=${asset.id}`}>
                            <Button className="btn-premium px-6 h-10 text-[10px] uppercase font-black tracking-widest">
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Inspeção
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Left Column: Info & History */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Main Photo Card */}
                    <Card className="border-border/60 shadow-2xl shadow-black/5 overflow-hidden rounded-[2.5rem] bg-card/60 backdrop-blur-xl">
                        <div className="aspect-[21/9] w-full bg-muted relative group">
                            {asset.image ? (
                                <img
                                    src={asset.image}
                                    alt={asset.name}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/20">
                                    <Zap className="h-20 w-20 mb-4" />
                                    <span className="text-xs font-black uppercase tracking-[0.3em]">Imagem Técnica Indisponível</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                                <div className="flex items-center gap-6 text-white w-full overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                            <MapPin className="h-5 w-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Localização</p>
                                            <p className="font-bold text-sm truncate uppercase tracking-tight">{asset.location}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Frequência</p>
                                            <p className="font-bold text-sm uppercase tracking-tight">{FREQUENCY_LABELS[asset.frequency] || asset.frequency}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Technical Specs Section */}
                    {(asset.brand || asset.model || asset.power) && (
                        <Card className="border-border/40 shadow-xl rounded-2xl overflow-hidden bg-muted/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                                    <Info className="h-4 w-4 text-primary" />
                                    Dados Técnicos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-3 gap-6 pt-4">
                                {asset.brand && (
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Marca</p>
                                        <p className="font-bold text-sm uppercase tracking-tight">{asset.brand}</p>
                                    </div>
                                )}
                                {asset.model && (
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Modelo</p>
                                        <p className="font-bold text-sm uppercase tracking-tight">{asset.model}</p>
                                    </div>
                                )}
                                {asset.power && (
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Potência</p>
                                        <p className="font-bold text-sm uppercase tracking-tight">{asset.power}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Checklist de Inspeção */}
                    {asset.scripts && asset.scripts.length > 0 && (
                        <Card className="border-border/40 shadow-xl rounded-2xl overflow-hidden bg-muted/5">
                            <CardHeader className="pb-2 border-b border-border/20">
                                <CardTitle className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                                    <ClipboardList className="h-4 w-4 text-primary" />
                                    Checklist de Ronda
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-wider">
                                    Perguntas verificadas durante a inspeção técnica
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                {asset.scripts.map((script: any, index: number) => (
                                    <div
                                        key={script.id}
                                        className="flex items-start gap-4 p-4 bg-background rounded-xl border border-border/40 hover:border-primary/40 transition-all"
                                    >
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold leading-relaxed">{script.question}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                {script.required && (
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase bg-red-500/10 text-red-600 border-red-500/30">
                                                        Obrigatório
                                                    </Badge>
                                                )}
                                                {script.requirePhoto && (
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase bg-blue-500/10 text-blue-600 border-blue-500/30">
                                                        Requer Foto
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Activity Section */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Inspections History */}
                        <Card className="border-border/40 shadow-xl rounded-2xl">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                                        <ClipboardCheck className="h-4 w-4 text-primary" />
                                        Rondas Recentes
                                    </CardTitle>
                                </div>
                                <span className="text-[10px] font-black bg-primary/5 text-primary px-3 py-1 rounded-full">{asset._count.inspections} TOTAL</span>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {asset.inspections.length === 0 ? (
                                    <p className="text-xs font-bold text-muted-foreground py-8 text-center uppercase tracking-widest">Nenhuma ronda registrada</p>
                                ) : (
                                    <div className="space-y-4">
                                        {asset.inspections.map((insp: any) => (
                                            <div key={insp.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-tight italic">{insp.user.name}</p>
                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{insp.completedAt ? formatDate(insp.completedAt) : formatDate(insp.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
                                                    {INSPECTION_STATUS_LABELS[insp.status] || insp.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Reports History */}
                        <Card className="border-border/40 shadow-xl rounded-2xl">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        Laudos de Ativo
                                    </CardTitle>
                                </div>
                                <span className="text-[10px] font-black bg-primary/5 text-primary px-3 py-1 rounded-full">{asset._count.reports} LAUDOS</span>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {asset.reports.length === 0 ? (
                                    <p className="text-xs font-bold text-muted-foreground py-8 text-center uppercase tracking-widest">Nenhum laudo encontrado</p>
                                ) : (
                                    <div className="space-y-4">
                                        {asset.reports.map((report: any) => (
                                            <Link href={`/contracts/${params.id}?tab=reports`} key={report.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all block">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-tight">{report.title}</p>
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{formatDate(report.executionDate)}</p>
                                                </div>
                                                < ChevronRight className="h-3 w-3 text-primary" />
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column: QR Code & Quick Info */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Última Ronda - Card Destacado */}
                    <Card className={`border-2 shadow-2xl rounded-3xl overflow-hidden ${asset.inspections.length > 0 ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                Status da Última Ronda
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {asset.inspections.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                        <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-black uppercase text-green-600">Concluída</p>
                                            <p className="text-xs text-muted-foreground font-bold">
                                                {asset.inspections[0].completedAt ? formatDate(asset.inspections[0].completedAt) : formatDate(asset.inspections[0].createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 px-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Técnico</span>
                                            <p className="text-sm font-bold">{asset.inspections[0].user.name}</p>
                                        </div>
                                        {asset.inspections[0].notes && (
                                            <div className="space-y-2 pt-2">
                                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Observações</span>
                                                <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl leading-relaxed">
                                                    {asset.inspections[0].notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <AlertCircle className="h-12 w-12 text-amber-500/40 mb-3" />
                                    <p className="text-sm font-black uppercase text-amber-600">
                                        Aguardando Primeira Ronda
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Nenhuma inspeção realizada ainda
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* QR IDENTIFICATION */}
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-background shadow-2xl rounded-3xl overflow-hidden text-center relative">
                        <div className="absolute top-0 right-0 p-4">
                            <QrCode className="h-10 w-10 text-primary opacity-10" />
                        </div>
                        <CardHeader className="pt-8 pb-4">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Identidade Digital</CardTitle>
                            <CardDescription className="text-[9px] font-bold uppercase tracking-widest">Escaneie para inspeção imediata</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-6 pb-8">
                            <div className="p-6 bg-white rounded-3xl shadow-xl border border-muted ring-8 ring-primary/5">
                                {/* QR Code funcional - aponta para página pública com informações em tempo real */}
                                <QRCodeDisplay value={qrCodeValue} size={160} />
                            </div>

                            <div className="w-full space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-center text-muted-foreground/60">
                                    ID: {asset.id.slice(-8).toUpperCase()}
                                </p>
                                <p className="text-[9px] text-center text-muted-foreground/50">
                                    Escaneie para ver informações atualizadas em tempo real
                                </p>
                            </div>

                            <Button variant="outline" className="w-full rounded-2xl border-primary/30 h-12 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all">
                                <Printer className="h-4 w-4 mr-2" />
                                Imprimir Etiqueta
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Technical Stats */}
                    <Card className="border-border/60 shadow-xl rounded-2xl overflow-hidden">
                        <CardContent className="p-0">
                            <div className="p-6 bg-muted/30 border-b border-border/40">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Última Atualização</p>
                                <p className="font-bold text-sm uppercase tracking-tight">{formatDate(asset.updatedAt)}</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-muted-foreground flex items-center gap-2">
                                        <History className="h-3 w-3" /> Idade no Sistema
                                    </span>
                                    <span className="font-black text-foreground uppercase">
                                        Desde {formatDate(asset.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Garantia + Bancada Externa */}
                    <AssetWarrantyBancada
                        assetId={asset.id}
                        installationDate={asset.installationDate?.toISOString()}
                        warrantyExpiry={asset.warrantyExpiry?.toISOString()}
                        isInExternalMaintenance={asset.isInExternalMaintenance}
                        externalCompany={asset.externalCompany}
                        externalMaintenanceSince={asset.externalMaintenanceSince?.toISOString()}
                        expectedReturnDate={asset.expectedReturnDate?.toISOString()}
                        externalMaintenanceNotes={asset.externalMaintenanceNotes}
                        canEdit={["ADMIN", "OWNER", "SUPERVISOR"].includes(session.user.role)}
                    />
                </div>
            </div>
        </div>
    );
}
