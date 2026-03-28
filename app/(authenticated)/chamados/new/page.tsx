"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Wrench, Loader2 } from "lucide-react";
import Link from "next/link";

const PRIORITIES = [
    { value: "LOW", label: "Baixa" },
    { value: "MEDIUM", label: "Média" },
    { value: "HIGH", label: "Alta" },
    { value: "CRITICAL", label: "Crítica" },
];

export default function NewChamadoPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const presetContractId = searchParams.get("contractId");
    const presetAssetId = searchParams.get("assetId");

    const [saving, setSaving] = useState(false);
    const [contracts, setContracts] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [selectedContract, setSelectedContract] = useState(presetContractId || "");

    const [form, setForm] = useState({
        contractId: presetContractId || "",
        assetId: presetAssetId || "",
        title: "",
        description: "",
        priority: "MEDIUM",
        assignedToId: "",
        notes: "",
    });

    useEffect(() => {
        loadContracts();
    }, []);

    useEffect(() => {
        if (form.contractId) {
            loadAssets(form.contractId);
            loadTechnicians(form.contractId);
        }
    }, [form.contractId]);

    async function loadContracts() {
        try {
            const res = await fetch("/api/contracts");
            if (res.ok) {
                const data = await res.json();
                setContracts(data);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function loadAssets(contractId: string) {
        try {
            const res = await fetch(`/api/contracts/${contractId}/assets`);
            if (res.ok) {
                const data = await res.json();
                setAssets(data);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function loadTechnicians(contractId: string) {
        try {
            const res = await fetch(`/api/contracts/${contractId}/users`);
            if (res.ok) {
                const data = await res.json();
                // Filtra técnicos e supervisores
                setTechnicians(data.filter((u: any) =>
                    ["TECHNICIAN", "SUPERVISOR"].includes(u.user?.role || u.role)
                ));
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.contractId || !form.title) {
            toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/chamados", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contractId: form.contractId,
                    assetId: form.assetId || undefined,
                    title: form.title,
                    description: form.description || undefined,
                    priority: form.priority,
                    assignedToId: form.assignedToId || undefined,
                    notes: form.notes || undefined,
                }),
            });

            if (res.ok) {
                toast({ title: "Chamado aberto com sucesso!" });
                router.push("/chamados");
            } else {
                const err = await res.json();
                toast({ title: err.error || "Erro ao abrir chamado", variant: "destructive" });
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/chamados">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
                        <Wrench className="h-6 w-6 text-primary" />
                        Novo Chamado
                    </h1>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                        Abrir ordem de serviço
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="rounded-2xl border-border/60 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-black uppercase tracking-widest text-muted-foreground">
                            Informações do Chamado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Contrato */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest">
                                Contrato *
                            </Label>
                            <select
                                required
                                value={form.contractId}
                                onChange={e => setForm(f => ({ ...f, contractId: e.target.value, assetId: "" }))}
                                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Selecione o contrato...</option>
                                {contracts.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name} — {c.company}</option>
                                ))}
                            </select>
                        </div>

                        {/* Ativo (opcional) */}
                        {assets.length > 0 && (
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest">
                                    Equipamento / Ativo <span className="text-muted-foreground">(opcional)</span>
                                </Label>
                                <select
                                    value={form.assetId}
                                    onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Sem equipamento específico</option>
                                    {assets.map((a: any) => (
                                        <option key={a.id} value={a.id}>{a.name} — {a.location || a.type}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Título */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest">
                                Título do Chamado *
                            </Label>
                            <Input
                                required
                                placeholder="Ex: Ar condicionado não resfria..."
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                className="font-bold"
                            />
                        </div>

                        {/* Descrição */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest">
                                Descrição
                            </Label>
                            <Textarea
                                placeholder="Descreva o problema em detalhes..."
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                className="font-bold min-h-[80px]"
                            />
                        </div>

                        {/* Prioridade */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest">
                                Prioridade
                            </Label>
                            <div className="grid grid-cols-4 gap-2">
                                {PRIORITIES.map(p => (
                                    <button
                                        key={p.value}
                                        type="button"
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

                        {/* Técnico Responsável */}
                        {technicians.length > 0 && (
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest">
                                    Técnico Responsável <span className="text-muted-foreground">(opcional)</span>
                                </Label>
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

                        {/* Observações */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest">
                                Observações
                            </Label>
                            <Textarea
                                placeholder="Observações adicionais..."
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
                    <Button
                        type="submit"
                        disabled={saving}
                        className="flex-1 rounded-xl font-black uppercase tracking-widest"
                    >
                        {saving ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Abrindo...</>
                        ) : (
                            "Abrir Chamado"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
