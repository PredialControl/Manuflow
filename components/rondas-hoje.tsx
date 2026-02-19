"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
    Sun, Moon, Clock, CheckCircle2, PlayCircle, AlertCircle,
    Building2, Calendar, ChevronRight, Loader2, ArrowRight, ArrowLeft, Check, MapPin, Camera, FileText, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RondaPdfDownloadButton } from "./ronda-pdf-download-button";

interface RondaStep {
    id: string;
    description: string;
    status: "PENDING" | "OK" | "WARNING" | "CRITICAL" | "SKIPPED";
    notes?: string;
    asset?: { name: string };
}

interface Ronda {
    id: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "MISSED";
    date: string;
    startedAt?: string;
    completedAt?: string;
    notes?: string;
    steps: RondaStep[];
    schedule: {
        id: string;
        name: string;
        shift: "DAY" | "NIGHT";
        time: string;
    };
    contract: {
        id: string;
        name: string;
        logo?: string;
    };
}

export function RondasHoje() {
    const [rondas, setRondas] = useState<Ronda[]>([]);
    const [loading, setLoading] = useState(true);
    const [executingRonda, setExecutingRonda] = useState<Ronda | null>(null);
    const [currentStepIdx, setCurrentStepIdx] = useState(0);

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

    async function startRonda(ronda: Ronda) {
        const res = await fetch(`/api/rondas/${ronda.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "IN_PROGRESS" }),
        });

        if (res.ok) {
            const updated = await res.json();
            const fullRonda = { ...ronda, ...updated };
            setExecutingRonda(fullRonda);
            setCurrentStepIdx(0);
            toast({ title: "Modo de execução iniciado", description: "Siga o roteiro passo a passo." });
        }
    }

    async function finishRonda() {
        if (!executingRonda) return;

        // Salvar o último passo antes de finalizar
        const lastStep = executingRonda.steps[currentStepIdx];
        await saveStep(lastStep.id);

        const res = await fetch(`/api/rondas/${executingRonda.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "COMPLETED" }),
        });

        if (res.ok) {
            toast({ title: "Ronda Finalizada!", description: "O relatório foi gerado com sucesso." });
            setExecutingRonda(null);
            fetchRondas();
        }
    }

    function updateStep(stepId: string, data: Partial<RondaStep>) {
        if (!executingRonda) return;
        const updatedSteps = executingRonda.steps.map(s => s.id === stepId ? { ...s, ...data } : s);
        setExecutingRonda({
            ...executingRonda,
            steps: updatedSteps
        });

        // Se estiver atualizando o status, salva imediatamente
        if (data.status) {
            const step = updatedSteps.find(s => s.id === stepId);
            if (step) {
                fetch(`/api/rondas/steps/${stepId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        status: step.status,
                        notes: step.notes,
                    }),
                });
            }
        }
    }

    async function saveStep(stepId: string) {
        if (!executingRonda) return;
        const step = executingRonda.steps.find(s => s.id === stepId);
        if (!step) return;

        await fetch(`/api/rondas/steps/${stepId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status: step.status,
                notes: step.notes,
            }),
        });
    }

    const nextStep = async () => {
        if (!executingRonda) return;
        const currentStep = executingRonda.steps[currentStepIdx];
        await saveStep(currentStep.id);
        setCurrentStepIdx(prev => prev + 1);
    };

    const prevStep = async () => {
        if (!executingRonda) return;
        const currentStep = executingRonda.steps[currentStepIdx];
        await saveStep(currentStep.id);
        setCurrentStepIdx(prev => prev - 1);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Carregando rondas...</p>
        </div>
    );

    // MODO EXECUÇÃO (Passo a Passo)
    if (executingRonda) {
        const totalSteps = executingRonda.steps.length;
        const currentStep = executingRonda.steps[currentStepIdx];
        const isLastStep = currentStepIdx === totalSteps - 1;

        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setExecutingRonda(null)} className="text-muted-foreground">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Sair
                    </Button>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest">Progresso</p>
                        <p className="text-sm font-black italic">{currentStepIdx + 1} de {totalSteps}</p>
                    </div>
                </div>

                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${((currentStepIdx + 1) / totalSteps) * 100}%` }}
                    />
                </div>

                <Card className="border-2 border-primary/20 shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <div className="bg-primary/5 p-6 border-b border-primary/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-black">
                                {currentStepIdx + 1}
                            </div>
                            <div>
                                <h3 className="font-black uppercase italic tracking-tight">{executingRonda.schedule.name}</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">{executingRonda.contract.name}</p>
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-10 space-y-8">
                        <div className="space-y-4 text-center">
                            <div className="inline-flex h-16 w-16 rounded-full bg-primary/10 items-center justify-center text-primary mb-2">
                                <MapPin className="h-8 w-8" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">
                                {currentStep?.description || "Iniciar Verificação"}
                            </h2>
                            {currentStep?.asset && (
                                <p className="text-sm font-bold text-primary uppercase tracking-widest">
                                    Ativo: {currentStep.asset.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-col gap-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Status da Verificação</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        onClick={() => updateStep(currentStep.id, { status: "OK" })}
                                        variant={currentStep.status === "OK" ? "default" : "outline"}
                                        className={cn(
                                            "h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2",
                                            currentStep.status === "OK" ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-500/20" : "border-emerald-500/20 text-emerald-600"
                                        )}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Em Funcionamento
                                    </Button>
                                    <Button
                                        onClick={() => updateStep(currentStep.id, { status: "WARNING" })}
                                        variant={currentStep.status === "WARNING" ? "destructive" : "outline"}
                                        className={cn(
                                            "h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2",
                                            currentStep.status === "WARNING" ? "bg-amber-500 hover:bg-amber-600 border-amber-500 shadow-lg shadow-amber-500/20" : "border-amber-500/20 text-amber-600"
                                        )}
                                    >
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        Atenção / Problema
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Observações Adicionais</p>
                                <textarea
                                    value={currentStep.notes || ""}
                                    onChange={(e) => updateStep(currentStep.id, { notes: e.target.value })}
                                    onBlur={() => saveStep(currentStep.id)}
                                    placeholder="Descreva detalhes se necessário..."
                                    className="w-full bg-muted/30 border-2 border-border/40 rounded-2xl p-4 text-sm font-medium focus:border-primary/40 focus:ring-0 transition-all min-h-[100px] resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <Button variant="outline" className="h-14 rounded-2xl border-dashed border-2 flex items-center justify-center gap-2">
                                    <Camera className="h-5 w-5 text-muted-foreground" />
                                    <span className="text-[9px] font-black uppercase">Anexar Foto Técnica</span>
                                </Button>
                            </div>
                        </div>
                    </CardContent>

                    <div className="p-6 bg-muted/30 border-t border-border/40 flex gap-4">
                        <Button
                            variant="ghost"
                            disabled={currentStepIdx === 0}
                            onClick={prevStep}
                            className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs"
                        >
                            Voltar
                        </Button>

                        {isLastStep ? (
                            <Button
                                onClick={finishRonda}
                                className="h-14 px-10 rounded-2xl btn-premium flex-1 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                            >
                                <Check className="h-4 w-4 mr-2" /> Finalizar Ronda
                            </Button>
                        ) : (
                            <Button
                                onClick={nextStep}
                                className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white flex-1 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                            >
                                Próximo Passo <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        );
    }

    // LISTAGEM DE HOJE
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-card border border-border/40 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                    <Calendar className="h-32 w-32" />
                </div>
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary relative">
                    <Calendar className="h-7 w-7" />
                </div>
                <div className="relative">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Programação de Hoje</p>
                    <h2 className="text-xl font-black uppercase italic tracking-tight">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</h2>
                </div>
            </div>

            <div className="grid gap-6">
                {rondas.length === 0 ? (
                    <div className="py-20 text-center bg-muted/10 rounded-[2rem] border-2 border-dashed">
                        <CheckCircle2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Tudo em dia por aqui!</p>
                    </div>
                ) : rondas.map((ronda) => (
                    <Card
                        key={ronda.id}
                        className={`rounded-[2rem] border-border/60 overflow-hidden transition-all hover:shadow-xl group ${ronda.status === 'COMPLETED' ? 'opacity-60 grayscale-[0.5]' : ''}`}
                    >
                        <CardContent className="p-0 flex flex-col sm:flex-row">
                            <div className={`p-8 sm:w-40 flex flex-col items-center justify-center gap-2 ${ronda.schedule.shift === 'DAY' ? 'bg-amber-500/5 text-amber-500' : 'bg-indigo-500/5 text-indigo-400'}`}>
                                {ronda.schedule.shift === 'DAY' ? <Sun className="h-8 w-8" /> : <Moon className="h-8 w-8" />}
                                <span className="text-lg font-black">{ronda.schedule.time}</span>
                            </div>
                            <div className="flex-1 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-xl font-black uppercase italic tracking-tight group-hover:text-primary transition-colors">{ronda.schedule.name}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{ronda.contract.name}</span>
                                    </div>
                                    {ronda.status === 'COMPLETED' && (
                                        <div className="mt-4 flex items-center gap-2 text-emerald-500">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Ronda Concluída ✓</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-4 sm:pt-0">
                                    {ronda.status !== 'COMPLETED' ? (
                                        <Button
                                            onClick={() => startRonda(ronda)}
                                            className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform"
                                        >
                                            {ronda.status === 'IN_PROGRESS' ? 'Continuar Ronda' : 'Iniciar Ronda'}
                                            <ChevronRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <RondaPdfDownloadButton ronda={ronda} />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
