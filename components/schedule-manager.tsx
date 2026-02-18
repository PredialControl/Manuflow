"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2, Clock, Sun, Moon, Calendar, Edit2, X, Check } from "lucide-react";

const DAYS = [
    { value: "MON", label: "Seg" },
    { value: "TUE", label: "Ter" },
    { value: "WED", label: "Qua" },
    { value: "THU", label: "Qui" },
    { value: "FRI", label: "Sex" },
    { value: "SAT", label: "Sáb" },
    { value: "SUN", label: "Dom" },
];

interface Schedule {
    id: string;
    name: string;
    description?: string;
    days: string[];
    shift: "DAY" | "NIGHT";
    time: string;
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

    function resetForm() {
        setForm({ name: "", description: "", days: [], shift: "DAY", time: "08:00" });
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
                        Configure dias, horários e turnos das rondas
                    </p>
                </div>
                <Button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="btn-premium h-10 px-6 rounded-xl text-xs font-black uppercase tracking-widest"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Agenda
                </Button>
            </div>

            {/* Formulário */}
            {showForm && (
                <Card className="border-primary/30 bg-primary/5 shadow-xl rounded-2xl animate-in fade-in slide-in-from-top-4">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">
                            {editingId ? "Editar Agenda" : "Nova Agenda de Ronda"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Nome da Ronda *
                                    </Label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Ex: Ronda Diurna Seg-Sex"
                                        className="h-11 rounded-xl bg-background border-border/40 font-bold"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Descrição
                                    </Label>
                                    <Input
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Descrição opcional"
                                        className="h-11 rounded-xl bg-background border-border/40 font-bold"
                                    />
                                </div>
                            </div>

                            {/* Dias da semana */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Dias da Semana *
                                </Label>
                                <div className="flex gap-2 flex-wrap">
                                    {DAYS.map((day) => (
                                        <button
                                            key={day.value}
                                            type="button"
                                            onClick={() => toggleDay(day.value)}
                                            className={`h-10 w-12 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2 ${form.days.includes(day.value)
                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                    : "bg-background text-muted-foreground border-border/40 hover:border-primary/40"
                                                }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                                {/* Atalhos */}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, days: ["MON", "TUE", "WED", "THU", "FRI"] })}
                                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                    >
                                        Seg–Sex
                                    </button>
                                    <span className="text-muted-foreground/30">·</span>
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] })}
                                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                    >
                                        Todos os dias
                                    </button>
                                    <span className="text-muted-foreground/30">·</span>
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, days: [] })}
                                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:underline"
                                    >
                                        Limpar
                                    </button>
                                </div>
                            </div>

                            {/* Turno e Horário */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Turno *
                                    </Label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, shift: "DAY" })}
                                            className={`flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-2 transition-all ${form.shift === "DAY"
                                                    ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20"
                                                    : "bg-background text-muted-foreground border-border/40 hover:border-amber-400/40"
                                                }`}
                                        >
                                            <Sun className="h-4 w-4" /> Diurno
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, shift: "NIGHT" })}
                                            className={`flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-2 transition-all ${form.shift === "NIGHT"
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20"
                                                    : "bg-background text-muted-foreground border-border/40 hover:border-indigo-400/40"
                                                }`}
                                        >
                                            <Moon className="h-4 w-4" /> Noturno
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Horário *
                                    </Label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="time"
                                            value={form.time}
                                            onChange={(e) => setForm({ ...form, time: e.target.value })}
                                            className="h-11 rounded-xl bg-background border-border/40 font-black pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={resetForm}
                                    className="h-11 px-6 rounded-xl font-bold uppercase tracking-widest text-xs"
                                >
                                    <X className="h-4 w-4 mr-2" /> Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="h-11 px-8 rounded-xl btn-premium text-xs font-black uppercase tracking-widest flex-1"
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    {editingId ? "Salvar Alterações" : "Criar Agenda"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Lista de agendas */}
            {loading ? (
                <div className="grid gap-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-24 rounded-2xl bg-muted/30 animate-pulse" />
                    ))}
                </div>
            ) : schedules.length === 0 ? (
                <Card className="border-dashed border-border/40 bg-muted/10 rounded-2xl">
                    <CardContent className="flex flex-col items-center justify-center py-14">
                        <Calendar className="h-12 w-12 text-muted-foreground/20 mb-4" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                            Nenhuma agenda configurada
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Crie uma agenda para programar as rondas dos técnicos
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {schedules.map((s) => (
                        <Card
                            key={s.id}
                            className="border-border/60 rounded-2xl bg-card/40 hover:border-primary/20 transition-all group"
                        >
                            <CardContent className="p-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    {/* Turno badge */}
                                    <div
                                        className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.shift === "DAY"
                                                ? "bg-amber-500/10 text-amber-500"
                                                : "bg-indigo-500/10 text-indigo-400"
                                            }`}
                                    >
                                        {s.shift === "DAY" ? (
                                            <Sun className="h-6 w-6" />
                                        ) : (
                                            <Moon className="h-6 w-6" />
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <h3 className="font-black uppercase italic tracking-tight text-base leading-none">
                                            {s.name}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            {/* Dias */}
                                            <div className="flex gap-1">
                                                {DAYS.map((d) => (
                                                    <span
                                                        key={d.value}
                                                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${s.days.includes(d.value)
                                                                ? "bg-primary/10 text-primary border border-primary/20"
                                                                : "bg-muted/30 text-muted-foreground/30 border border-transparent"
                                                            }`}
                                                    >
                                                        {d.label}
                                                    </span>
                                                ))}
                                            </div>
                                            {/* Horário */}
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {s.time}
                                                </span>
                                            </div>
                                        </div>
                                        {s.description && (
                                            <p className="text-[10px] text-muted-foreground/60 font-bold">
                                                {s.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                                        onClick={() => startEdit(s)}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => handleDelete(s.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
