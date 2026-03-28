"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ClipboardCheck,
    MapPin,
    CheckCircle2,
    Clock,
    Zap,
    Building2,
    RefreshCcw,
    Loader2,
    Gauge,
    PartyPopper,
    Target,
    Play,
    Wrench,
    AlertCircle,
    Package,
    ChevronRight,
    Droplets,
    Flame,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Wind,
    Hammer,
    Zap as ZapIcon,
    Package as PackageIcon
} from "lucide-react";

const categoryMap: Record<string, { label: string, icon: any, color: string }> = {
    AR_CONDICIONADO: { label: "Ar Condicionado", icon: Wind, color: "text-blue-500" },
    CIVIL: { label: "Civil", icon: Hammer, color: "text-orange-500" },
    ELETRICA: { label: "Elétrica", icon: ZapIcon, color: "text-yellow-500" },
    HIDRAULICA: { label: "Hidráulica", icon: Droplets, color: "text-cyan-500" },
    INCENDIO: { label: "Incêndio", icon: Flame, color: "text-red-500" },
    GERAL: { label: "Geral", icon: PackageIcon, color: "text-slate-500" },
};

const PRIORITY_COLOR: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-600",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
};
const PRIORITY_LABEL: Record<string, string> = {
    LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", CRITICAL: "Crítica",
};

export function TechnicianDashboard() {
    const [rounds, setRounds] = useState<any[]>([]);
    const [devices, setDevices] = useState<any[]>([]);
    const [chamados, setChamados] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadAll() {
        setLoading(true);
        try {
            const [roundsRes, devicesRes, chamadosRes] = await Promise.all([
                fetch("/api/technician/pending"),
                fetch("/api/technician/devices"),
                fetch("/api/chamados"),
            ]);
            const [roundsData, devicesData, chamadosData] = await Promise.all([
                roundsRes.json(),
                devicesRes.json(),
                chamadosRes.json(),
            ]);
            setRounds(Array.isArray(roundsData) ? roundsData : []);
            setDevices(Array.isArray(devicesData) ? devicesData : []);
            setChamados(Array.isArray(chamadosData) ? chamadosData : []);
        } catch (error) {
            console.error("Error loading tasks:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
        const interval = setInterval(loadAll, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading && rounds.length === 0 && chamados.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Carregando tarefas...</p>
            </div>
        );
    }

    // ── Rondas ─────────────────────────────────────────────────────────────────
    const pendingRounds = rounds.filter(r => !r.isDoneToday);
    const doneRounds = rounds.filter(r => r.isDoneToday);

    // ── Leituras ───────────────────────────────────────────────────────────────
    const devicesByContract = devices.reduce((acc: any, device: any) => {
        const contractId = device.contract.id;
        if (!acc[contractId]) {
            acc[contractId] = {
                contractId,
                contractName: device.contract.name,
                devices: [],
                hasReadingsToday: false,
            };
        }
        acc[contractId].devices.push(device);
        const hasReading = device.entries[0] &&
            new Date(device.entries[0].createdAt).toDateString() === new Date().toDateString();
        if (hasReading) acc[contractId].hasReadingsToday = true;
        return acc;
    }, {});
    const contracts = Object.values(devicesByContract) as any[];
    const pendingReadings = contracts.filter((c: any) => !c.hasReadingsToday).length;

    // ── Chamados ───────────────────────────────────────────────────────────────
    const openChamados = chamados.filter(c => c.status === "OPEN");
    const inProgressChamados = chamados.filter(c =>
        ["IN_PROGRESS", "WAITING_PARTS", "WAITING_APPROVAL"].includes(c.status)
    );
    const activeChamados = [...openChamados, ...inProgressChamados];

    // ── Progresso geral ────────────────────────────────────────────────────────
    const totalTasks = rounds.length + contracts.length + activeChamados.length;
    const completedTasks =
        doneRounds.length +
        contracts.filter((c: any) => c.hasReadingsToday).length;
    // chamados ativos contam como "pendentes" no progresso
    const allTasksComplete = totalTasks > 0 &&
        pendingRounds.length === 0 &&
        pendingReadings === 0 &&
        activeChamados.length === 0;

    const today = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long'
    });

    return (
        <div className="space-y-6 animate-in pb-20">
            {/* Header */}
            <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{today}</p>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">
                        Minhas Tarefas
                    </h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={loadAll}
                        className="rounded-xl hover:bg-primary/5 text-primary"
                    >
                        <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Parabéns */}
            {allTasksComplete && (
                <Card className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30 shadow-lg rounded-2xl overflow-hidden">
                    <CardContent className="p-6 text-center">
                        <PartyPopper className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                        <h2 className="text-xl font-black uppercase tracking-tight text-emerald-600 mb-1">Parabéns!</h2>
                        <p className="text-sm font-bold text-emerald-600/80">Você completou todas as tarefas de hoje!</p>
                    </CardContent>
                </Card>
            )}

            {/* Resumo de pendências */}
            <div className="grid grid-cols-3 gap-3">
                <Card className={cn("shadow-none rounded-2xl", pendingRounds > 0 ? "bg-amber-500/5 border-amber-500/20" : "bg-emerald-500/5 border-emerald-500/20")}>
                    <CardContent className="p-3 text-center">
                        <ClipboardCheck className={cn("h-5 w-5 mx-auto mb-1", pendingRounds > 0 ? "text-amber-500" : "text-emerald-500")} />
                        <p className={cn("text-xl font-black", pendingRounds > 0 ? "text-amber-600" : "text-emerald-600")}>{pendingRounds}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Rondas</p>
                    </CardContent>
                </Card>
                <Card className={cn("shadow-none rounded-2xl", pendingReadings > 0 ? "bg-blue-500/5 border-blue-500/20" : "bg-emerald-500/5 border-emerald-500/20")}>
                    <CardContent className="p-3 text-center">
                        <Gauge className={cn("h-5 w-5 mx-auto mb-1", pendingReadings > 0 ? "text-blue-500" : "text-emerald-500")} />
                        <p className={cn("text-xl font-black", pendingReadings > 0 ? "text-blue-600" : "text-emerald-600")}>{pendingReadings}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Leituras</p>
                    </CardContent>
                </Card>
                <Card className={cn("shadow-none rounded-2xl", activeChamados.length > 0 ? "bg-red-500/5 border-red-500/20" : "bg-emerald-500/5 border-emerald-500/20")}>
                    <CardContent className="p-3 text-center">
                        <Wrench className={cn("h-5 w-5 mx-auto mb-1", activeChamados.length > 0 ? "text-red-500" : "text-emerald-500")} />
                        <p className={cn("text-xl font-black", activeChamados.length > 0 ? "text-red-600" : "text-emerald-600")}>{activeChamados.length}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Chamados</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── SEÇÃO: Chamados ────────────────────────────────────────────────── */}
            {activeChamados.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-red-500" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-red-600">
                            Chamados ativos ({activeChamados.length})
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {activeChamados.map((chamado: any) => {
                            const isOpen = chamado.status === "OPEN";
                            return (
                                <Link key={chamado.id} href="/chamados">
                                    <Card className="border-border/60 hover:border-red-400/40 hover:shadow-md transition-all rounded-2xl cursor-pointer">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={cn(
                                                        "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
                                                        isOpen ? "bg-yellow-100" : "bg-blue-100"
                                                    )}>
                                                        {isOpen
                                                            ? <AlertCircle className="w-4 h-4 text-yellow-600" />
                                                            : <Wrench className="w-4 h-4 text-blue-600" />
                                                        }
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm truncate leading-tight">{chamado.title}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                                                                PRIORITY_COLOR[chamado.priority] || "bg-gray-100 text-gray-600")}>
                                                                {PRIORITY_LABEL[chamado.priority] || chamado.priority}
                                                            </span>
                                                            {chamado.asset?.name && (
                                                                <span className="text-[10px] text-muted-foreground truncate">
                                                                    • {chamado.asset.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── SEÇÃO: Leituras de Medidores ───────────────────────────────────── */}
            {contracts.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-blue-500" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-blue-600">
                            Leituras de Medidores
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {contracts.map((contract: any) => (
                            <Link
                                key={contract.contractId}
                                href={`/contracts/${contract.contractId}?tab=measurements`}
                                className={cn("block", contract.hasReadingsToday && "opacity-60")}
                            >
                                <Card className={cn(
                                    "shadow-none rounded-2xl transition-all group",
                                    contract.hasReadingsToday
                                        ? "bg-emerald-500/5 border-emerald-500/20"
                                        : "bg-card border-border/40 hover:border-blue-400/40 hover:bg-blue-500/[0.02]"
                                )}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <Building2 className="h-3 w-3 text-primary flex-shrink-0" />
                                                    <h3 className="text-sm font-black tracking-tight uppercase italic truncate">
                                                        {contract.contractName}
                                                    </h3>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {contract.devices.map((device: any) => (
                                                        <div key={device.id} className={cn(
                                                            "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                                            device.type === "WATER" && "bg-blue-500/10 text-blue-600",
                                                            device.type === "ENERGY" && "bg-yellow-500/10 text-yellow-600",
                                                            device.type === "GAS" && "bg-orange-500/10 text-orange-600"
                                                        )}>
                                                            {device.type === "WATER" && <Droplets className="h-2.5 w-2.5" />}
                                                            {device.type === "ENERGY" && <Zap className="h-2.5 w-2.5" />}
                                                            {device.type === "GAS" && <Flame className="h-2.5 w-2.5" />}
                                                            {device.type === "WATER" ? "Água" : device.type === "ENERGY" ? "Energia" : "Gás"}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {contract.hasReadingsToday ? (
                                                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                    </div>
                                                ) : (
                                                    <div className="h-10 w-10 rounded-xl bg-blue-500/5 group-hover:bg-blue-500 group-hover:text-white transition-all flex flex-col items-center justify-center text-blue-500">
                                                        <Play className="h-4 w-4 fill-current" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* ── SEÇÃO: Ronda Técnica ───────────────────────────────────────────── */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-amber-500" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-amber-600">
                        Ronda Técnica {rounds.length > 0 && `(${pendingRounds} pendentes)`}
                    </h2>
                </div>

                {rounds.length === 0 ? (
                    <Card className="border-dashed border-border/40 rounded-2xl">
                        <CardContent className="py-10 text-center">
                            <ClipboardCheck className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Nenhum equipamento na ronda
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                                Peça ao administrador para vincular equipamentos ao seu perfil
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {rounds.map((round: any) => (
                            <Link
                                key={round.id}
                                href={round.isDoneToday ? "#" : `/inspections/new?assetId=${round.id}&contractId=${round.contractId}`}
                                className={cn(
                                    "block group",
                                    round.isDoneToday && "opacity-50 pointer-events-none"
                                )}
                            >
                                <Card className={cn(
                                    "transition-all border-border/60 rounded-2xl overflow-hidden",
                                    round.isDoneToday
                                        ? "bg-muted/20"
                                        : "bg-card hover:border-amber-400/50 hover:shadow-md"
                                )}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Building2 className="h-2.5 w-2.5 text-muted-foreground/50 flex-shrink-0" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 truncate">
                                                        {round.contractName}
                                                    </span>
                                                    {round.type && (
                                                        <>
                                                            <span className="text-muted-foreground/30">·</span>
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/50 flex items-center gap-0.5">
                                                                <Zap className="h-2 w-2" /> {round.type}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <h3 className="text-base font-black tracking-tight uppercase italic truncate">
                                                    {round.name}
                                                </h3>
                                                {round.location && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <MapPin className="h-3 w-3 text-muted-foreground/50" />
                                                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">
                                                            {round.location}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0">
                                                {round.isDoneToday ? (
                                                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                    </div>
                                                ) : (
                                                    <div className="h-10 px-3 rounded-xl bg-amber-500/10 group-hover:bg-amber-500 group-hover:text-white transition-all flex items-center justify-center text-amber-600 gap-1">
                                                        <Play className="h-4 w-4 fill-current" />
                                                        <span className="text-[9px] font-black uppercase">Fazer</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-4">
                <p className="text-[8px] font-black text-center text-muted-foreground/30 uppercase tracking-[0.3em]">
                    ManuFlow Technical System v1.0
                </p>
            </div>
        </div>
    );
}
