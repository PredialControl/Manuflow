"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Wrench, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

const PRIORITIES = [
    { value: "LOW", label: "Baixa" },
    { value: "MEDIUM", label: "Média" },
    { value: "HIGH", label: "Alta" },
    { value: "CRITICAL", label: "Crítica" },
];

const STATUSES = [
    { value: "OPEN", label: "Aberto" },
    { value: "IN_PROGRESS", label: "Em Atendimento" },
    { value: "WAITING_PARTS", label: "Aguardando Peças" },
    { value: "WAITING_APPROVAL", label: "Aguardando Aprovação" },
    { value: "COMPLETED", label: "Concluído" },
    { value: "CANCELLED", label: "Cancelado" },
];

export default function EditChamadoPage() {
    const router = useRouter();
    const params = useParams();
    const chamadoId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [call, setCall] = useState<any>(null);

    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "MEDIUM",
        status: "OPEN",
        assignedToId: "",
        resolution: "",
        notes: "",
    });

    useEffect(() => {
        loadCall();
    }, [chamadoId]);

    async function loadCall() {
        try {
            const res = await fetch(`/api/chamados/${chamadoId}`);
            if (res.ok) {
                const data = await res.json();
                setCall(data);
                setForm({
                    title: data.title || "",
                    description: data.description || "",
                    priority: data.priority || "MEDIUM",
                    status: data.status || "OPEN",
                    assignedToId: data.assignedTo?.id || "",
                    resolution: data.resolution || "",
                    notes: data.notes || "",
                });
                // Load technicians for this contract
                if (data.contract?.id) {
                    const res2 = await fetch(`/api/contracts/${data.contract.id}/users`);
                    if (res2.ok) {
                        const users = await res2.json();
                        setTechnicians(users.filter((u: any) =>
                            ["TECHNICIAN", "SUPERVISOR"].includes(u.user?.role || u.role)
                        ));
                    }
                }
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/chamados/${chamadoId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description || null,
                    priority: form.priority,
                    status: form.status,
                    assignedToId: form.assignedToId || null,
                    resolution: form.resolution || null,
                    notes: form.notes || null,
                }),
            });

            if (res.ok) {
                toast({ title: "Chamado atualizado com sucesso!" });
                router.push("/chamados");
            } else {
                const err = await res.json();
                toast({ title: err.error || "Erro ao atualizar", variant: "destructive" });
            }
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (!call) {
        return (
            <div className="text-center py-20">
                <p className="font-bold text-muted-foreground">Chamado não encontrado</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in">
            <div className="flex items-center gap-4">
                <Link href="/chamados">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
                        <Wrench className="h-6 w-6 text-primary" />
                        Editar Chamado
                    </h1>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                        {call.contract?.name}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="rounded-2xl border-border/60 shadow-sm">
                    <CardContent className="pt-6 space-y-5">
                        {/* Status */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Status</Label>
                            <select
                                value={form.status}
                                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {STATUSES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Título */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Título *</Label>
                            <Input
                                required
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                className="font-bold"
                            />
                        </div>

                        {/* Descrição */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Descrição</Label>
                            <Textarea
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                className="font-bold min-h-[80px]"
                            />
                        </div>

                        {/* Prioridade */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Prioridade</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {PRIORITIES.map(p => (
                                    <button key={p.value} type="button"
                                        onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                                        className={`py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                            form.priority === p.value
                                                ? p.value === "LOW" ? "border-slate-500 bg-slate-500/10 text-slate-700"
                                                : p.value === "MEDIUM" ? "border-amber-500 bg-amber-500/10 text-amber-700"
                                                : p.value === "HIGH" ? "border-orange-500 bg-orange-500/10 text-orange-700"
                                                : "border-rose-600 bg-rose-500/10 text-rose-700"
                                                : "border-border text-muted-foreground hover:border-primary/40"
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Técnico */}
                        {technicians.length > 0 && (
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest">Técnico Responsável</Label>
                                <select
                                    value={form.assignedToId}
                                    onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Sem atribuição</option>
                                    {technicians.map((t: any) => {
                                        const user = t.user || t;
                                        return (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.role === "TECHNICIAN" ? "Técnico" : "Supervisor"})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}

                        {/* Resolução */}
                        {["COMPLETED", "CANCELLED"].includes(form.status) && (
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest">
                                    Resolução / Conclusão
                                </Label>
                                <Textarea
                                    placeholder="Descreva como foi resolvido..."
                                    value={form.resolution}
                                    onChange={e => setForm(f => ({ ...f, resolution: e.target.value }))}
                                    className="font-bold min-h-[80px]"
                                />
                            </div>
                        )}

                        {/* Observações */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Observações</Label>
                            <Textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                className="font-bold min-h-[60px]"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-3 pt-2">
                    <Link href="/chamados" className="flex-1">
                        <Button variant="outline" className="w-full rounded-xl font-black uppercase tracking-widest" type="button">
                            Cancelar
                        </Button>
                    </Link>
                    <Button type="submit" disabled={saving} className="flex-1 rounded-xl font-black uppercase tracking-widest">
                        {saving ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</>
                        ) : "Salvar Alterações"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
