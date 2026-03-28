"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus, AlertTriangle, Clock, CheckCircle2, XCircle, Loader2,
    RefreshCcw, Package, Building2, User, Wrench, ChevronRight,
    Flame, AlertCircle, CircleDot, PauseCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STATUS_COLUMNS = [
    {
        key: "OPEN",
        label: "Abertos",
        icon: AlertCircle,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
    },
    {
        key: "IN_PROGRESS",
        label: "Em Atendimento",
        icon: CircleDot,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
    },
    {
        key: "WAITING_PARTS",
        label: "Ag. Peças",
        icon: PauseCircle,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
    },
    {
        key: "WAITING_APPROVAL",
        label: "Ag. Aprovação",
        icon: Clock,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/30",
    },
    {
        key: "COMPLETED",
        label: "Concluídos",
        icon: CheckCircle2,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
    },
];

const PRIORITY_MAP: Record<string, { label: string; color: string; icon: any }> = {
    LOW: { label: "Baixa", color: "text-slate-500", icon: AlertCircle },
    MEDIUM: { label: "Média", color: "text-amber-500", icon: AlertTriangle },
    HIGH: { label: "Alta", color: "text-orange-500", icon: AlertTriangle },
    CRITICAL: { label: "Crítica", color: "text-rose-600", icon: Flame },
};

interface ServiceCall {
    id: string;
    title: string;
    description?: string;
    priority: string;
    status: string;
    openedAt: string;
    completedAt?: string;
    openedBy: { name: string; email: string };
    assignedTo?: { name: string; email: string; category?: string };
    contract: { id: string; name: string; company: string };
    asset?: { id: string; name: string; type: string; location?: string };
    notes?: string;
}

interface Props {
    contractId?: string;
    showNewButton?: boolean;
    role?: string;
}

export function ChamadosKanban({ contractId, showNewButton = true, role }: Props) {
    const [calls, setCalls] = useState<ServiceCall[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selected, setSelected] = useState<ServiceCall | null>(null);

    async function loadCalls() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (contractId) params.set("contractId", contractId);
            const res = await fetch(`/api/chamados?${params}`);
            if (res.ok) {
                const data = await res.json();
                setCalls(data);
            }
        } catch (e) {
            console.error("[CHAMADOS]", e);
        } finally {
            setLoading(false);
        }
    }

    async function updateStatus(id: string, status: string) {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/chamados/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                const updated = await res.json();
                setCalls(prev => prev.map(c => c.id === id ? updated : c));
                if (selected?.id === id) setSelected(updated);
            }
        } finally {
            setUpdatingId(null);
        }
    }

    useEffect(() => {
        loadCalls();
    }, [contractId]);

    const callsByStatus = STATUS_COLUMNS.reduce((acc, col) => {
        acc[col.key] = calls.filter(c => c.status === col.key);
        return acc;
    }, {} as Record<string, ServiceCall[]>);

    const totalOpen = calls.filter(c => c.status === "OPEN" || c.status === "IN_PROGRESS").length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-3 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    Carregando chamados...
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={loadCalls} className="rounded-xl">
                        <RefreshCcw className="h-4 w-4 text-primary" />
                    </Button>
                    {totalOpen > 0 && (
                        <span className="text-xs font-black uppercase tracking-widest text-rose-500">
                            {totalOpen} em aberto
                        </span>
                    )}
                </div>
                {showNewButton && (
                    <Link href={contractId ? `/chamados/new?contractId=${contractId}` : "/chamados/new"}>
                        <Button className="rounded-xl gap-2 font-black uppercase tracking-widest text-xs">
                            <Plus className="h-4 w-4" />
                            Novo Chamado
                        </Button>
                    </Link>
                )}
            </div>

            {calls.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Wrench className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        Nenhum chamado registrado
                    </p>
                    {showNewButton && (
                        <Link href={contractId ? `/chamados/new?contractId=${contractId}` : "/chamados/new"}>
                            <Button variant="outline" className="rounded-xl gap-2 font-bold uppercase tracking-widest text-xs mt-2">
                                <Plus className="h-4 w-4" />
                                Abrir primeiro chamado
                            </Button>
                        </Link>
                    )}
                </div>
            ) : (
                /* Kanban Board */
                <div className="overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-max">
                        {STATUS_COLUMNS.map((col) => {
                            const colCalls = callsByStatus[col.key] || [];
                            const ColIcon = col.icon;
                            return (
                                <div key={col.key} className="w-72 flex-shrink-0">
                                    {/* Column Header */}
                                    <div className={cn(
                                        "flex items-center justify-between px-4 py-3 rounded-xl mb-3 border",
                                        col.bg, col.border
                                    )}>
                                        <div className="flex items-center gap-2">
                                            <ColIcon className={cn("h-4 w-4", col.color)} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", col.color)}>
                                                {col.label}
                                            </span>
                                        </div>
                                        <span className={cn(
                                            "text-xs font-black px-2 py-0.5 rounded-full",
                                            col.bg, col.color
                                        )}>
                                            {colCalls.length}
                                        </span>
                                    </div>

                                    {/* Cards */}
                                    <div className="space-y-3">
                                        {colCalls.length === 0 ? (
                                            <div className="py-8 text-center border-2 border-dashed border-border/40 rounded-xl">
                                                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                                    Vazio
                                                </p>
                                            </div>
                                        ) : (
                                            colCalls.map((call) => {
                                                const priority = PRIORITY_MAP[call.priority] || PRIORITY_MAP.MEDIUM;
                                                const PriorityIcon = priority.icon;
                                                return (
                                                    <Card
                                                        key={call.id}
                                                        className="border-border/60 hover:border-primary/40 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl"
                                                        onClick={() => setSelected(selected?.id === call.id ? null : call)}
                                                    >
                                                        <CardContent className="p-4 space-y-3">
                                                            {/* Priority + Contract */}
                                                            <div className="flex items-center justify-between">
                                                                <span className={cn(
                                                                    "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest",
                                                                    priority.color
                                                                )}>
                                                                    <PriorityIcon className="h-3 w-3" />
                                                                    {priority.label}
                                                                </span>
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                                                                    <Building2 className="h-2.5 w-2.5" />
                                                                    {call.contract.name}
                                                                </span>
                                                            </div>

                                                            {/* Title */}
                                                            <h3 className="text-sm font-black uppercase tracking-tight leading-tight">
                                                                {call.title}
                                                            </h3>

                                                            {/* Asset */}
                                                            {call.asset && (
                                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                                                                    <Package className="h-3 w-3" />
                                                                    {call.asset.name}
                                                                    {call.asset.location && (
                                                                        <span className="text-muted-foreground/60">• {call.asset.location}</span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Technician */}
                                                            {call.assignedTo && (
                                                                <div className="flex items-center gap-1.5 text-[10px] text-primary font-bold">
                                                                    <User className="h-3 w-3" />
                                                                    {call.assignedTo.name}
                                                                </div>
                                                            )}

                                                            {/* Date */}
                                                            <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest">
                                                                {new Date(call.openedAt).toLocaleDateString("pt-BR")}
                                                            </p>

                                                            {/* Waiting material info — always visible when relevant */}
                                                            {call.waitingMaterial && (
                                                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 space-y-1">
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-orange-700">
                                                                        Material aguardando
                                                                    </p>
                                                                    <p className="text-xs text-orange-900 font-medium">{call.waitingMaterial}</p>
                                                                    {call.waitingMaterialLink && (
                                                                        <a href={call.waitingMaterialLink} target="_blank" rel="noopener noreferrer"
                                                                            className="text-[9px] text-blue-600 underline block truncate">
                                                                            {call.waitingMaterialLink}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Expanded Detail */}
                                                            {selected?.id === call.id && (
                                                                <div className="border-t border-border/40 pt-3 space-y-3 animate-in">
                                                                    {call.description && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {call.description}
                                                                        </p>
                                                                    )}

                                                                    {/* Status Actions */}
                                                                    <div className="space-y-2">
                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                                            Mover para:
                                                                        </p>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {STATUS_COLUMNS
                                                                                .filter(s => s.key !== call.status && s.key !== "CANCELLED")
                                                                                .map(s => (
                                                                                    <button
                                                                                        key={s.key}
                                                                                        disabled={updatingId === call.id}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            updateStatus(call.id, s.key);
                                                                                        }}
                                                                                        className={cn(
                                                                                            "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border transition-all",
                                                                                            s.bg, s.border, s.color,
                                                                                            "hover:opacity-80"
                                                                                        )}
                                                                                    >
                                                                                        {updatingId === call.id ? "..." : s.label}
                                                                                    </button>
                                                                                ))
                                                                            }
                                                                        </div>
                                                                    </div>

                                                                    <Link
                                                                        href={`/chamados/${call.id}/edit`}
                                                                        className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                                                        onClick={e => e.stopPropagation()}
                                                                    >
                                                                        Editar chamado <ChevronRight className="h-3 w-3" />
                                                                    </Link>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
