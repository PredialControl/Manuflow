import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
    Info
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DeleteAssetButton } from "@/components/delete-asset-button";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({
    params,
}: {
    params: { id: string; assetId: string };
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const asset = await prisma.asset.findFirst({
        where: {
            id: params.assetId,
            contractId: params.id,
            active: true,
            deletedAt: null,
        },
        include: {
            contract: true,
            reports: {
                where: { deletedAt: null },
                orderBy: { createdAt: "desc" },
                take: 5,
            },
            inspections: {
                orderBy: { createdAt: "desc" },
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
    });

    if (!asset) {
        notFound();
    }

    // Identificador único para o QR Code (URL da página)
    const qrCodeValue = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/contracts/${params.id}/assets/${params.assetId}`;

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

                {session.user.role === "ADMIN" && (
                    <div className="flex gap-2">
                        <DeleteAssetButton
                            assetId={asset.id}
                            contractId={params.id}
                            assetName={asset.name}
                        />
                        <Button variant="outline" className="rounded-xl border-border/60 font-bold uppercase tracking-widest text-[10px] h-10">
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar
                        </Button>
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
                                            <p className="font-bold text-sm uppercase tracking-tight">{asset.frequency}</p>
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
                                        {asset.inspections.map((insp) => (
                                            <div key={insp.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-tight italic">{insp.user.name}</p>
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{formatDate(insp.createdAt)}</p>
                                                </div>
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${insp.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                                    }`}>
                                                    {insp.status}
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
                                        {asset.reports.map((report) => (
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
                                {/* Aqui futuramente integraria com uma lib de QR, mas agora deixamos o placeholder visual premium */}
                                <div className="h-40 w-40 bg-muted flex items-center justify-center rounded-2xl overflow-hidden relative border border-dashed border-primary/20">
                                    <QrCode className="h-24 w-24 text-primary opacity-20" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-primary/40 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg">ID: {asset.id.slice(-6).toUpperCase()}</span>
                                    </div>
                                </div>
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
                </div>
            </div>
        </div>
    );
}
