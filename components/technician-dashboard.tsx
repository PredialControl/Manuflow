"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ClipboardCheck,
    MapPin,
    ChevronRight,
    CheckCircle2,
    Clock,
    Zap,
    Building2,
    RefreshCcw,
    Loader2,
    Gauge,
    PartyPopper,
    Target
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Wind,
    Hammer,
    Zap as ZapIcon,
    Droplets,
    Flame,
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

export function TechnicianDashboard() {
    const [rounds, setRounds] = useState<any[]>([]);
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadRounds() {
        setLoading(true);
        try {
            const res = await fetch("/api/technician/pending");
            const data = await res.json();
            setRounds(data);
        } catch (error) {
            console.error("Error loading rounds:", error);
        } finally {
            setLoading(false);
        }
    }

    async function loadDevices() {
        try {
            const res = await fetch("/api/technician/devices");
            const data = await res.json();
            setDevices(data);
        } catch (error) {
            console.error("Error loading devices:", error);
        }
    }

    useEffect(() => {
        loadRounds();
        loadDevices();
        const interval = setInterval(() => {
            loadRounds();
            loadDevices();
        }, 60000); // Sincroniza a cada minuto
        return () => clearInterval(interval);
    }, []);

    if (loading && rounds.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Rounds...</p>
            </div>
        );
    }

    const pendingCount = rounds.filter(r => !r.isDoneToday).length;
    const doneCount = rounds.filter(r => r.isDoneToday).length;
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    // Agrupar medidores por contrato
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

        // Verificar se tem leitura hoje
        const hasReading = device.entries[0] &&
            new Date(device.entries[0].createdAt).toDateString() === new Date().toDateString();
        if (hasReading) {
            acc[contractId].hasReadingsToday = true;
        }

        return acc;
    }, {});

    const contracts = Object.values(devicesByContract);
    const contractsWithPendingReadings = contracts.filter((c: any) => !c.hasReadingsToday).length;

    // Total de tarefas = rounds pendentes + contratos com leituras pendentes
    const totalTasks = rounds.length + contracts.length;
    const completedTasks = doneCount + contracts.filter((c: any) => c.hasReadingsToday).length;
    const allTasksComplete = totalTasks > 0 && completedTasks === totalTasks;

    return (
        <div className="space-y-6 animate-in pb-20">
            <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{today}</p>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Minha Ronda</h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={loadRounds}
                        className="rounded-xl hover:bg-primary/5 text-primary"
                    >
                        <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Mensagem de Parabéns */}
            {allTasksComplete && (
                <Card className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30 shadow-lg rounded-2xl overflow-hidden">
                    <CardContent className="p-6 text-center">
                        <PartyPopper className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                        <h2 className="text-xl font-black uppercase tracking-tight text-emerald-600 mb-1">Parabéns!</h2>
                        <p className="text-sm font-bold text-emerald-600/80">Você completou todas as tarefas de hoje</p>
                    </CardContent>
                </Card>
            )}

            {/* Progresso Geral */}
            {totalTasks > 0 && (
                <Card className="bg-card border-border/40 shadow-none rounded-2xl">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Progresso de Hoje</p>
                            </div>
                            <p className="text-sm font-black text-primary">{completedTasks}/{totalTasks}</p>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                                style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-amber-500/5 border-amber-500/10 shadow-none rounded-2xl">
                    <CardContent className="p-4">
                        <p className="text-[8px] font-black uppercase tracking-widest text-amber-600/60">Inspeções Pendentes</p>
                        <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-500/5 border-blue-500/10 shadow-none rounded-2xl">
                    <CardContent className="p-4">
                        <p className="text-[8px] font-black uppercase tracking-widest text-blue-600/60">Leituras Pendentes</p>
                        <p className="text-2xl font-black text-blue-600">{contractsWithPendingReadings}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Seção de Leituras de Medidores */}
            {contracts.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Leituras de Medidores</h2>
                    </div>
                    <div className="space-y-3">
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
                                        : "bg-card border-border/40 hover:border-primary/30 hover:bg-primary/[0.02]"
                                )}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Building2 className="h-3 w-3 text-primary" />
                                                    <h3 className="text-base font-black tracking-tight uppercase italic truncate">{contract.contractName}</h3>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {contract.devices.map((device: any) => (
                                                        <div key={device.id} className={cn(
                                                            "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                                            device.type === "WATER" && "bg-blue-500/10 text-blue-600",
                                                            device.type === "ENERGY" && "bg-yellow-500/10 text-yellow-600",
                                                            device.type === "GAS" && "bg-orange-500/10 text-orange-600"
                                                        )}>
                                                            {device.type === "WATER" && <Droplets className="h-3 w-3" />}
                                                            {device.type === "ENERGY" && <Zap className="h-3 w-3" />}
                                                            {device.type === "GAS" && <Flame className="h-3 w-3" />}
                                                            {device.type === "WATER" ? "Água" : device.type === "ENERGY" ? "Energia" : "Gás"}
                                                            {device.entries[0] && (
                                                                <span className="ml-1">• {device.entries[0].value} {device.unit}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-[8px] text-muted-foreground uppercase tracking-widest mt-2">
                                                    {contract.devices.length} {contract.devices.length === 1 ? "medidor" : "medidores"}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {contract.hasReadingsToday ? (
                                                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                        <CheckCircle2 className="h-6 w-6" />
                                                    </div>
                                                ) : (
                                                    <div className="h-12 w-12 rounded-xl bg-primary/5 group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center text-primary">
                                                        <Gauge className="h-5 w-5" />
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

            <div className="space-y-4">
                {rounds.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                            <ClipboardCheck className="h-8 w-8 text-muted-foreground/20" />
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nenhum equipamento vinculado ao seu perfil</p>
                    </div>
                ) : (
                    rounds.map((round) => (
                        <Link
                            key={round.id}
                            href={round.isDoneToday ? "#" : `/inspections/new?assetId=${round.id}&contractId=${round.contractId}`}
                            className={cn(
                                "block group",
                                round.isDoneToday && "opacity-60 grayscale-[0.5] pointer-events-none"
                            )}
                        >
                            <Card className={cn(
                                "transition-all duration-300 border-border/60 hover:border-primary/40 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-xl",
                                round.isDoneToday ? "bg-muted/30" : "bg-card hover:bg-primary/[0.02]"
                            )}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                                                    <Building2 className="h-2 w-2" /> {round.contractName}
                                                </span>
                                                {round.category && categoryMap[round.category] && (
                                                    <>
                                                        <span className="h-1 w-1 rounded-full bg-border" />
                                                        <span className={cn("text-[8px] font-black uppercase tracking-widest flex items-center gap-1", categoryMap[round.category].color)}>
                                                            {React.createElement(categoryMap[round.category].icon, { className: "h-2 w-2" })}
                                                            {categoryMap[round.category].label}
                                                        </span>
                                                    </>
                                                )}
                                                <span className="h-1 w-1 rounded-full bg-border" />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-primary/60 flex items-center gap-1">
                                                    <Zap className="h-2 w-2" /> {round.type}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black tracking-tighter uppercase italic truncate">{round.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{round.location}</p>
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0">
                                            {round.isDoneToday ? (
                                                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <CheckCircle2 className="h-5 w-5" />
                                                </div>
                                            ) : (
                                                <div className="h-10 w-10 rounded-xl bg-primary/5 group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center text-primary">
                                                    <ChevronRight className="h-5 w-5" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>

            <div className="pt-8">
                <p className="text-[8px] font-black text-center text-muted-foreground/40 uppercase tracking-[0.3em]">
                    ManuFlow Technical System v1.0
                </p>
            </div>
        </div>
    );
}
