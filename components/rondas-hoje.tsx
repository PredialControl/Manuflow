"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
    Sun, Moon, Clock, CheckCircle2, PlayCircle, AlertCircle,
    Building2, Calendar, ChevronRight, Loader2
} from "lucide-react";

interface Ronda {
    id: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "MISSED";
    date: string;
    startedAt?: string;
    completedAt?: string;
    notes?: string;
    schedule: {
        id: string;
        name: string;
        shift: "DAY" | "NIGHT";
        time: string;
        days: string[];
    };
    contract: {
        id: string;
        name: string;
        logo?: string;
    };
}

const statusConfig = {
    PENDING: {
        label: "Pendente",
        color: "text-amber-500",
        bg: "bg-amber-500/10 border-amber-500/20",
        icon: Clock,
    },
    IN_PROGRESS: {
        label: "Em Andamento",
        color: "text-blue-500",
        bg: "bg-blue-500/10 border-blue-500/20",
        icon: PlayCircle,
    },
    COMPLETED: {
        label: "Concluída",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        icon: CheckCircle2,
    },
    MISSED: {
        label: "Não Realizada",
        color: "text-rose-500",
        bg: "bg-rose-500/10 border-rose-500/20",
        icon: AlertCircle,
    },
};

export function RondasHoje() {
    const [rondas, setRondas] = useState<Ronda[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    const hoje = new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    useEffect(() => {
        fetchRondas();
    }, []);

    async function fetchRondas() {
        setLoading(true);
        const res = await fetch("/api/rondas/hoje");
        if (res.ok) {
            const data = await res.json();
            setRondas(data);
        }
        setLoading(false);
    }

    async function updateStatus(id: string, status: string) {
        setUpdating(id);
        const res = await fetch(`/api/rondas/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });

        if (res.ok) {
            const updated = await res.json();
            setRondas((prev) =>
                prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
            );
            toast({
                title: status === "IN_PROGRESS" ? "Ronda iniciada!" : "Ronda concluída! ✓",
                description: status === "COMPLETED" ? "Ótimo trabalho!" : undefined,
            });
        } else {
            toast({ variant: "destructive", title: "Erro ao atualizar ronda" });
        }
        setUpdating(null);
    }

    const pendentes = rondas.filter((r) => r.status === "PENDING");
    const emAndamento = rondas.filter((r) => r.status === "IN_PROGRESS");
    const concluidas = rondas.filter((r) => r.status === "COMPLETED");

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    Carregando rondas...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header do dia */}
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                        Rondas de Hoje
                    </p>
                    <h2 className="text-lg font-black uppercase italic tracking-tight capitalize">
                        {hoje}
                    </h2>
                </div>
                <div className="ml-auto flex gap-3 text-center">
                    <div>
                        <p className="text-2xl font-black text-primary">{rondas.length}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total</p>
                    </div>
                    <div className="w-px bg-border" />
                    <div>
                        <p className="text-2xl font-black text-emerald-500">{concluidas.length}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Feitas</p>
                    </div>
                </div>
            </div>

            {rondas.length === 0 ? (
                <Card className="border-dashed border-border/40 bg-muted/10 rounded-2xl">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500/30 mb-4" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                            Sem rondas programadas para hoje
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {/* Em Andamento */}
                    {emAndamento.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 px-1">
                                ● Em Andamento
                            </p>
                            {emAndamento.map((ronda) => (
                                <RondaCard
                                    key={ronda.id}
                                    ronda={ronda}
                                    onUpdate={updateStatus}
                                    updating={updating}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pendentes */}
                    {pendentes.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 px-1">
                                ○ Pendentes
                            </p>
                            {pendentes.map((ronda) => (
                                <RondaCard
                                    key={ronda.id}
                                    ronda={ronda}
                                    onUpdate={updateStatus}
                                    updating={updating}
                                />
                            ))}
                        </div>
                    )}

                    {/* Concluídas */}
                    {concluidas.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 px-1">
                                ✓ Concluídas
                            </p>
                            {concluidas.map((ronda) => (
                                <RondaCard
                                    key={ronda.id}
                                    ronda={ronda}
                                    onUpdate={updateStatus}
                                    updating={updating}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function RondaCard({
    ronda,
    onUpdate,
    updating,
}: {
    ronda: Ronda;
    onUpdate: (id: string, status: string) => void;
    updating: string | null;
}) {
    const cfg = statusConfig[ronda.status];
    const StatusIcon = cfg.icon;
    const isUpdating = updating === ronda.id;

    return (
        <Card
            className={`rounded-2xl border transition-all ${ronda.status === "IN_PROGRESS"
                    ? "border-blue-500/30 bg-blue-500/5 shadow-lg shadow-blue-500/5"
                    : ronda.status === "COMPLETED"
                        ? "border-emerald-500/20 bg-emerald-500/5 opacity-70"
                        : "border-border/60 bg-card/40"
                }`}
        >
            <CardContent className="p-5">
                <div className="flex items-start gap-4">
                    {/* Turno icon */}
                    <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${ronda.schedule.shift === "DAY"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-indigo-500/10 text-indigo-400"
                            }`}
                    >
                        {ronda.schedule.shift === "DAY" ? (
                            <Sun className="h-6 w-6" />
                        ) : (
                            <Moon className="h-6 w-6" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="font-black uppercase italic tracking-tight text-base leading-tight">
                                    {ronda.schedule.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Building2 className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                                        {ronda.contract.name}
                                    </span>
                                </div>
                            </div>

                            {/* Status badge */}
                            <div
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest flex-shrink-0 ${cfg.bg} ${cfg.color}`}
                            >
                                <StatusIcon className="h-3 w-3" />
                                {cfg.label}
                            </div>
                        </div>

                        {/* Horário */}
                        <div className="flex items-center gap-1.5 mt-3">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-black text-muted-foreground">
                                {ronda.schedule.time}
                            </span>
                            {ronda.startedAt && (
                                <>
                                    <span className="text-muted-foreground/30">·</span>
                                    <span className="text-[10px] text-muted-foreground font-bold">
                                        Iniciada às{" "}
                                        {new Date(ronda.startedAt).toLocaleTimeString("pt-BR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </>
                            )}
                            {ronda.completedAt && (
                                <>
                                    <span className="text-muted-foreground/30">·</span>
                                    <span className="text-[10px] text-emerald-500 font-bold">
                                        Concluída às{" "}
                                        {new Date(ronda.completedAt).toLocaleTimeString("pt-BR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Ações */}
                        {ronda.status !== "COMPLETED" && ronda.status !== "MISSED" && (
                            <div className="flex gap-2 mt-4">
                                {ronda.status === "PENDING" && (
                                    <Button
                                        size="sm"
                                        onClick={() => onUpdate(ronda.id, "IN_PROGRESS")}
                                        disabled={isUpdating}
                                        className="h-9 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {isUpdating ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <>
                                                <PlayCircle className="h-3.5 w-3.5 mr-1.5" />
                                                Iniciar Ronda
                                            </>
                                        )}
                                    </Button>
                                )}
                                {ronda.status === "IN_PROGRESS" && (
                                    <Button
                                        size="sm"
                                        onClick={() => onUpdate(ronda.id, "COMPLETED")}
                                        disabled={isUpdating}
                                        className="h-9 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {isUpdating ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                                Concluir Ronda
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
