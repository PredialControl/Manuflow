"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2, Clock, Sun, Moon, Calendar, Edit2, X, Check, MapPin, GripVertical } from "lucide-react";

const DAYS = [
    { value: "MON", label: "Seg" },
    { value: "TUE", label: "Ter" },
    { value: "WED", label: "Qua" },
    { value: "THU", label: "Qui" },
    { value: "FRI", label: "Sex" },
    { value: "SAT", label: "Sáb" },
    { value: "SUN", label: "Dom" },
];

interface ScheduleStep {
    task: string;
    assetId?: string;
}

interface Schedule {
    id: string;
    name: string;
    description?: string;
    days: string[];
    shift: "DAY" | "NIGHT";
    time: string;
    steps?: ScheduleStep[];
    active: boolean;
    contract: { name: string };
    _count: { occurrences: number };
}

interface Props {
    contractId: string;
}

export function ScheduleManager({ contractId }: Props) {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "",
        description: "",
        days: [] as string[],
        shift: "DAY" as "DAY" | "NIGHT",
        time: "08:00",
        steps: [] as ScheduleStep[],
    });

    useEffect(() => {
        fetchSchedules();
    }, [contractId]);

    async function fetchSchedules() {
        setLoading(true);
        const res = await fetch(`/api/schedules?contractId=${contractId}`);
        const data = await res.json();
        setSchedules(data);
        setLoading(false);
    }

    function toggleDay(day: string) {
        setForm((f) => ({
            ...f,
            days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
        }));
    }

    function addStep() {
        setForm(f => ({
            ...f,
            steps: [...f.steps, { task: "" }]
        }));
    }

    function removeStep(index: number) {
        setForm(f => ({
            ...f,
            steps: f.steps.filter((_, i) => i !== index)
        }));
    }

    function updateStep(index: number, task: string) {
        setForm(f => ({
            ...f,
            steps: f.steps.map((s, i) => i === index ? { ...s, task } : s)
        }));
    }

    function resetForm() {
        setForm({ name: "", description: "", days: [], shift: "DAY", time: "08:00", steps: [] });
        setShowForm(false);
        setEditingId(null);
    }

    function startEdit(s: Schedule) {
        setForm({
            name: s.name,
            description: s.description || "",
            days: s.days,
            shift: s.shift,
            time: s.time,
            steps: s.steps || [],
        });
        setEditingId(s.id);
        setShowForm(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name || form.days.length === 0 || !form.time) {
            toast({ variant: "destructive", title: "Preencha todos os campos obrigatórios" });
            return;
        }

        const url = editingId ? `/api/schedules/${editingId}` : "/api/schedules";
        const method = editingId ? "PATCH" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, contractId }),
        });

        if (!res.ok) {
            toast({ variant: "destructive", title: "Erro ao salvar agenda" });
            return;
        }

        toast({ title: editingId ? "Agenda atualizada!" : "Agenda criada!" });
        resetForm();
        fetchSchedules();
    }

    async function handleDelete(id: string) {
        const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast({ title: "Agenda removida" });
            fetchSchedules();
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black tracking-tight uppercase italic text-muted-foreground/40">
                        Agendas de Ronda
                    </h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        Configure dias, horários e roteiros guiados
                    </p>
                </div>
                {!showForm && (
                    <Button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="btn-premium h-10 px-6 rounded-xl text-xs font-black uppercase tracking-widest"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Agenda
                    </Button>
                )}
            </div>

            {/* Formulário */}
            {showForm && (
                <Card className="border-primary/30 bg-primary/5 shadow-2xl rounded-3xl animate-in fade-in slide-in-from-top-4 overflow-hidden">
                    <CardHeader className="bg-primary/10 pb-6">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> {editingId ? "Editar Agenda de Ronda" : "Nova Agenda de Ronda"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        Nome da Ronda *
                                    </Label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Ex: Ronda Predial Manhã"
                                        className="h-12 rounded-2xl bg-background border-border/40 font-bold focus:ring-primary/20"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        Descrição
                                    </Label>
                                    <Input
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Ex: Roteiro de verificação de geradores e bombas"
                                        className="h-12 rounded-2xl bg-background border-border/40 font-bold"
                                    />
                                </div>
                            </div>

                            {/* Dias da semana */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between ml-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Dias da Semana *
                                    </Label>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setForm({ ...form, days: ["MON", "TUE", "WED", "THU", "FRI"] })} className="text-[9px] font-black uppercase text-primary hover:opacity-70 transition-opacity">SEG-SEX</button>
                                        <button type="button" onClick={() => setForm({ ...form, days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] })} className="text-[9px] font-black uppercase text-primary hover:opacity-70 transition-opacity">TODO DIA</button>
                                    </div>
                                </div>
                                <div className="flex gap-2.5 flex-wrap">
                                    {DAYS.map((day) => (
                                        <button
                                            key={day.value}
                                            type="button"
                                            onClick={() => toggleDay(day.value)}
                                            className={`h-12 w-12 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${form.days.includes(day.value)
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                : "bg-background text-muted-foreground border-border/40 hover:border-primary/40"
                                                }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        Turno *
                                    </Label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, shift: "DAY" })}
                                            className={`flex-1 h-12 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-3 border-2 transition-all ${form.shift === "DAY"
                                                ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20"
                                                : "bg-background text-muted-foreground border-border/40 hover:border-amber-400/40"
                                                }`}
                                        >
                                            <Sun className="h-4 w-4" /> Diurno
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, shift: "NIGHT" })}
                                            className={`flex-1 h-12 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-3 border-2 transition-all ${form.shift === "NIGHT"
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20"
                                                : "bg-background text-muted-foreground border-border/40 hover:border-indigo-400/40"
                                                }`}
                                        >
                                            <Moon className="h-4 w-4" /> Noturno
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        Horário de Início *
                                    </Label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="time"
                                            value={form.time}
                                            onChange={(e) => setForm({ ...form, time: e.target.value })}
                                            className="h-12 rounded-2xl bg-background border-border/40 font-black pl-12 text-base"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Roteiro Progressivo */}
                            <div className="space-y-4 pt-4">
                                <div className="flex items-center justify-between border-b border-primary/20 pb-2 mb-4">
                                    <Label className="text-sm font-black uppercase tracking-widest text-primary italic">
                                        Roteiro da Ronda (Passo a Passo)
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addStep}
                                        className="h-8 rounded-lg border-primary/40 text-primary hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest"
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Adicionar Ponto
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {form.steps.map((step, index) => (
                                        <div key={index} className="flex gap-3 animate-in fade-in slide-in-from-right-4 transition-all group">
                                            <div className="h-12 w-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center font-black text-primary/40 text-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 relative">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                                <Input
                                                    value={step.task}
                                                    onChange={(e) => updateStep(index, e.target.value)}
                                                    placeholder="Vá até o... Verifique o..."
                                                    className="h-12 rounded-2xl bg-background border-border/40 font-bold pl-12"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => removeStep(index)}
                                                className="h-12 w-12 rounded-2xl opacity-40 hover:opacity-100 transition-all bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border-none"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {form.steps.length === 0 && (
                                        <div className="py-8 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-border/40">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">Crie o roteiro passo a passo da ronda</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-border/40">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={resetForm}
                                    className="h-12 px-8 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground hover:bg-muted"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="h-12 px-10 rounded-2xl btn-premium text-[10px] font-black uppercase tracking-[0.2em] flex-1 shadow-2xl shadow-primary/30"
                                >
                                    {editingId ? "Salvar Alterações" : "Confirmar e Programar Ronda"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Lista de agendas */}
            <div className="grid gap-6">
                {loading ? (
                    [1, 2].map((i) => (
                        <div key={i} className="h-32 rounded-3xl bg-muted/40 animate-pulse" />
                    ))
                ) : schedules.map((s) => (
                    <Card
                        key={s.id}
                        className="border-border/60 rounded-3xl bg-card/40 hover:border-primary/30 transition-all group overflow-hidden"
                    >
                        <CardContent className="p-0 flex flex-col sm:flex-row sm:items-stretch">
                            <div className={`w-28 sm:w-32 flex flex-col items-center justify-center gap-2 p-6 transition-colors ${s.shift === "DAY" ? "bg-amber-500/5 text-amber-500 group-hover:bg-amber-500/10" : "bg-indigo-500/5 text-indigo-400 group-hover:bg-indigo-500/10"}`}>
                                {s.shift === "DAY" ? <Sun className="h-8 w-8" /> : <Moon className="h-8 w-8" />}
                                <span className="text-lg font-black">{s.time}</span>
                            </div>

                            <div className="flex-1 p-6 flex flex-col justify-center gap-4">
                                <div>
                                    <h3 className="text-xl font-black uppercase italic tracking-tight leading-none group-hover:text-primary transition-colors">{s.name}</h3>
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="flex gap-1">
                                            {DAYS.map((d) => (
                                                <span
                                                    key={d.value}
                                                    className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border ${s.days.includes(d.value)
                                                        ? "bg-primary text-white border-primary"
                                                        : "bg-muted/10 text-muted-foreground/30 border-transparent"
                                                        }`}
                                                >
                                                    {d.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {s.steps && s.steps.length > 0 && (
                                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
                                            <div className="h-1 w-1 rounded-full bg-primary" />
                                            {s.steps.length} pontos de verificação
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 flex items-center gap-2 bg-muted/5 sm:bg-transparent border-t sm:border-t-0 sm:border-l border-border/40">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-11 w-11 rounded-xl h-11 w-11 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all"
                                    onClick={() => startEdit(s)}
                                >
                                    <Edit2 className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-11 w-11 rounded-xl h-11 w-11 rounded-2xl hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                                    onClick={() => handleDelete(s.id)}
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
