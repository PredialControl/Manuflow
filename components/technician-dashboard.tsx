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
    Gauge
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
    const [measurements, setMeasurements] = useState<any[]>([]);
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

    async function loadMeasurements() {
        try {
            const res = await fetch("/api/technician/measurements");
            const data = await res.json();
            setMeasurements(data);
        } catch (error) {
            console.error("Error loading measurements:", error);
        }
    }

    useEffect(() => {
        loadRounds();
        loadMeasurements();
        const interval = setInterval(() => {
            loadRounds();
            loadMeasurements();
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

            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/10 shadow-none rounded-2xl">
                    <CardContent className="p-4">
                        <p className="text-[8px] font-black uppercase tracking-widest text-primary/60">Pendentes</p>
                        <p className="text-2xl font-black text-primary">{pendingCount}</p>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-500/5 border-emerald-500/10 shadow-none rounded-2xl">
                    <CardContent className="p-4">
                        <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500/60">Concluídas</p>
                        <p className="text-2xl font-black text-emerald-500">{doneCount}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Seção de Medições */}
            {measurements.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Minhas Leituras</h2>
                    </div>
                    <div className="space-y-2">
                        {measurements.slice(0, 5).map((entry: any) => (
                            <Card key={entry.id} className="bg-card border-border/40 shadow-none rounded-xl hover:border-primary/30 transition-colors">
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                                                    <Building2 className="h-2 w-2" /> {entry.device.contract.name}
                                                </span>
                                                <span className="h-1 w-1 rounded-full bg-border" />
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase tracking-widest flex items-center gap-1",
                                                    entry.device.type === "WATER" && "text-blue-500",
                                                    entry.device.type === "ENERGY" && "text-yellow-500",
                                                    entry.device.type === "GAS" && "text-orange-500"
                                                )}>
                                                    {entry.device.type === "WATER" && <Droplets className="h-2 w-2" />}
                                                    {entry.device.type === "ENERGY" && <Zap className="h-2 w-2" />}
                                                    {entry.device.type === "GAS" && <Flame className="h-2 w-2" />}
                                                    {entry.device.type === "WATER" ? "Água" : entry.device.type === "ENERGY" ? "Energia" : "Gás"}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-foreground truncate">{entry.device.name}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <p className="text-lg font-black text-primary">{entry.value}</p>
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{entry.device.unit}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
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
