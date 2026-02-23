"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    FileText,
    Calendar,
    DollarSign,
    Upload,
    X,
    Camera,
    Paperclip,
    Loader2,
    ChevronUp,
    CheckCircle2,
    Sparkles,
    History,
    Clock,
    AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { useToast } from "@/components/ui/use-toast";

type Attachment = {
    id: string;
    url: string;
    filename: string;
    fileType: string;
    user: { name: string };
};

type RelevantItemHistory = {
    id: string;
    oldStatus: string | null;
    newStatus: string;
    createdAt: string;
    user: { name: string };
};

type RelevantItem = {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority?: string;
    dueDate?: Date | string;
    value?: number;
    notes?: string;
    contract: { id?: string; name: string; company: string };
    user: { name: string };
    attachments: Attachment[];
    history: RelevantItemHistory[];
    createdAt: Date | string;
};

type KanbanColumn = {
    id: string;
    title: string;
    status: string[];
    color: string;
    bgColor: string;
    dotColor: string;
};

const COLUMNS: KanbanColumn[] = [
    {
        id: "awaiting_budget",
        title: "Ag. Orçamentos",
        status: ["AWAITING_BUDGET"],
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10 border border-blue-500/20",
        dotColor: "bg-blue-500",
    },
    {
        id: "awaiting_approval",
        title: "Ag. Aprovação",
        status: ["AWAITING_APPROVAL"],
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-500/10 border border-amber-500/20",
        dotColor: "bg-amber-500",
    },
    {
        id: "approved",
        title: "Aprovados",
        status: ["APPROVED"],
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-500/10 border border-emerald-500/20",
        dotColor: "bg-emerald-500",
    },
    {
        id: "completed",
        title: "Concluídos",
        status: ["COMPLETED"],
        color: "text-slate-500 dark:text-slate-400",
        bgColor: "bg-slate-500/10 border border-slate-500/20",
        dotColor: "bg-slate-400",
    },
];

type PendingFile = {
    file: File;
    preview: string;
    type: "image" | "pdf" | "document";
};

interface RelevantItemsKanbanProps {
    initialItems: RelevantItem[];
    contractId?: string;
}

export function RelevantItemsKanban({ initialItems = [], contractId }: RelevantItemsKanbanProps) {
    const { toast } = useToast();
    const [items, setItems] = useState<RelevantItem[]>(initialItems || []);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Formulário inline
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "MEDIUM",
        value: "",
        dueDate: "",
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // Modal de Conclusão
    const [itemToComplete, setItemToComplete] = useState<RelevantItem | null>(null);
    const [completionFiles, setCompletionFiles] = useState<PendingFile[]>([]);
    const [completing, setCompleting] = useState(false);
    const completionFileRef = useRef<HTMLInputElement>(null);
    const completionCameraRef = useRef<HTMLInputElement>(null);

    // Debug logging
    useEffect(() => {
        console.log("[RelevantItemsKanban] Montado - contractId:", contractId);
    }, [contractId]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
    );

    // ── Drag & Drop ──────────────────────────────────────────────
    const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeItem = items.find((i) => i.id === active.id);
        const overColumn = COLUMNS.find((c) => c.id === over.id);
        if (!activeItem || !overColumn) return;

        const newStatus = overColumn.status[0];
        if (activeItem.status === newStatus) return;

        // Se mover para Concluído, pede fotos
        if (newStatus === "COMPLETED") {
            setItemToComplete(activeItem);
            return;
        }

        await updateItemStatus(activeItem.id, newStatus);
    };

    const updateItemStatus = async (itemId: string, newStatus: string, additionalFiles: PendingFile[] = []) => {
        try {
            const res = await fetch(`/api/relevant-items/${itemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error();
            let updatedItem = await res.json();

            // Se tiver arquivos extras (fotos da execução)
            if (additionalFiles.length > 0) {
                for (const pf of additionalFiles) {
                    const fd = new FormData();
                    fd.append("file", pf.file);
                    const attRes = await fetch(`/api/relevant-items/${itemId}/attachments`, {
                        method: "POST",
                        body: fd,
                    });
                    if (attRes.ok) {
                        const att = await attRes.json();
                        updatedItem = { ...updatedItem, attachments: [...(updatedItem.attachments || []), att] };
                    }
                }
            }

            setItems((prev) => prev.map((i) => (i.id === itemId ? updatedItem : i)));
            const colName = COLUMNS.find(c => c.status.includes(newStatus))?.title || newStatus;
            toast({ title: "Status atualizado!", description: `Movido para ${colName}`, variant: "success" });
            return updatedItem;
        } catch {
            toast({ title: "Erro ao atualizar status", variant: "destructive" });
            return null;
        }
    };

    const handleConfirmCompletion = async () => {
        if (!itemToComplete) return;
        if (completionFiles.length === 0) {
            toast({ title: "Fotos obrigatórias", description: "Por favor, anexe fotos da execução para concluir.", variant: "destructive" });
            return;
        }

        setCompleting(true);
        const success = await updateItemStatus(itemToComplete.id, "COMPLETED", completionFiles);
        if (success) {
            setItemToComplete(null);
            setCompletionFiles([]);
        }
        setCompleting(false);
    };

    // ── Selecionar arquivos ──────────────────────────────────────
    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;
        const added: PendingFile[] = Array.from(files).map((file) => {
            const isImage = file.type.startsWith("image/");
            const isPdf = file.type === "application/pdf";
            return {
                file,
                preview: isImage ? URL.createObjectURL(file) : "",
                type: isImage ? "image" : isPdf ? "pdf" : "document",
            };
        });
        setPendingFiles((prev) => [...prev, ...added]);
    };

    const removePendingFile = (index: number) => {
        setPendingFiles((prev) => {
            const copy = [...prev];
            if (copy[index].preview) URL.revokeObjectURL(copy[index].preview);
            copy.splice(index, 1);
            return copy;
        });
    };

    // ── Criar item ───────────────────────────────────────────────
    const handleCreate = async () => {
        console.log("[RelevantItemsKanban] Tentando criar item...");
        if (!form.title.trim()) {
            toast({ title: "Título obrigatório", variant: "destructive" });
            return;
        }
        if (!contractId) {
            console.error("[RelevantItemsKanban] contractId ausente!");
            toast({ title: "Erro crítico", description: "Contrato não identificado no componente", variant: "destructive" });
            return;
        }

        setCreating(true);
        try {
            console.log("[RelevantItemsKanban] Enviando POST para /api/relevant-items");
            const res = await fetch("/api/relevant-items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, contractId }),
            });

            // Se não for JSON, pegamos o texto puro primeiro
            const contentType = res.headers.get("content-type");
            let data: any;
            if (contentType && contentType.includes("application/json")) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(`Resposta inválida do servidor: ${text.substring(0, 100)}`);
            }

            if (!res.ok) {
                console.error("[RelevantItemsKanban] Erro na API:", data);
                throw new Error(data?.error ?? `Erro ${res.status}`);
            }

            console.log("[RelevantItemsKanban] Item criado com sucesso:", data.id);
            let item = data;

            // Upload de arquivos
            if (pendingFiles.length > 0) {
                console.log(`[RelevantItemsKanban] Iniciando upload de ${pendingFiles.length} arquivos...`);
                for (const pf of pendingFiles) {
                    const fd = new FormData();
                    fd.append("file", pf.file);
                    const attRes = await fetch(`/api/relevant-items/${item.id}/attachments`, {
                        method: "POST",
                        body: fd,
                    });
                    if (attRes.ok) {
                        const att = await attRes.json();
                        item = { ...item, attachments: [...(item.attachments ?? []), att] };
                    } else {
                        console.warn("[RelevantItemsKanban] Falha ao enviar anexo:", pf.file.name);
                    }
                }
            }

            setItems((prev) => [item, ...prev]);
            setForm({ title: "", description: "", priority: "MEDIUM", value: "", dueDate: "" });
            pendingFiles.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
            setPendingFiles([]);
            setShowForm(false);
            toast({ title: "Item criado!", description: "O item foi adicionado ao contrato", variant: "success" });
        } catch (err: any) {
            console.error("[RelevantItemsKanban] Erro no handleCreate:", err);
            toast({ title: "Erro ao criar", description: String(err?.message ?? err), variant: "destructive" });
        } finally {
            setCreating(false);
        }
    };

    // ── Anexar a item existente ──────────────────────────────────
    const handleAttach = async (itemId: string, file: File) => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/relevant-items/${itemId}/attachments`, { method: "POST", body: fd });
        if (!res.ok) throw new Error();
        const att = await res.json();
        setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, attachments: [...i.attachments, att] } : i)));
    };

    const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

    return (
        <div className="space-y-6">
            {/* ── Cabeçalho ── */}
            <div className="flex items-center justify-between bg-card/40 p-4 rounded-2xl border border-border/40">
                <div>
                    <h2 className="text-xl font-black tracking-tight uppercase italic">Itens / Orçamentos</h2>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                        Pendências, Orçamentos e Melhorias
                    </p>
                </div>
                {contractId && (
                    <Button
                        onClick={() => {
                            console.log("[RelevantItemsKanban] Toggle formulário");
                            setShowForm((v) => !v);
                        }}
                        className="btn-premium flex items-center gap-2"
                    >
                        {showForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {showForm ? "Fechar" : "Novo Item"}
                    </Button>
                )}
            </div>

            {/* ── Formulário inline ── */}
            {showForm && contractId && (
                <div className="border border-primary/20 rounded-2xl p-6 bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-300 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Plus className="h-5 w-5" />
                        </div>
                        <h3 className="font-black text-lg uppercase tracking-tight italic">Novo Lançamento</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="ri-title" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Título do Item *</Label>
                                <Input
                                    id="ri-title"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="O que precisa ser feito?"
                                    className="h-12 rounded-xl border-border/60 focus:ring-primary shadow-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="ri-desc" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Descrição / Justificativa</Label>
                                <Textarea
                                    id="ri-desc"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Detalhes adicionais..."
                                    rows={4}
                                    className="rounded-xl border-border/60 focus:ring-primary resize-none p-3 shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Prioridade</Label>
                                    <select
                                        value={form.priority}
                                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                        className="w-full h-11 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                                    >
                                        <option value="LOW">🟢 Baixa</option>
                                        <option value="MEDIUM">🟡 Média</option>
                                        <option value="HIGH">🔴 Alta</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="ri-value" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Vlr. Estimado</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">R$</span>
                                        <Input
                                            id="ri-value"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={form.value}
                                            onChange={(e) => setForm({ ...form, value: e.target.value })}
                                            placeholder="0,00"
                                            className="h-11 pl-10 rounded-xl border-border/60 focus:ring-primary shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="ri-due" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Prazo / Previsão</Label>
                                <Input
                                    id="ri-due"
                                    type="date"
                                    value={form.dueDate}
                                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                    className="h-11 rounded-xl border-border/60 focus:ring-primary shadow-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Anexos (Fotos/PDF)</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => cameraInputRef.current?.click()}
                                        className="flex-1 h-12 rounded-xl border-dashed border-2 flex flex-col items-center justify-center gap-1 hover:border-primary hover:text-primary transition-all"
                                    >
                                        <Camera className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase">Foto</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex-1 h-12 rounded-xl border-dashed border-2 flex flex-col items-center justify-center gap-1 hover:border-primary hover:text-primary transition-all"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase">Arquivo</span>
                                    </Button>
                                </div>
                                <input ref={cameraInputRef} type="file" className="hidden" accept="image/*" capture="environment" multiple onChange={(e) => handleFileSelect(e.target.files)} />
                                <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" multiple onChange={(e) => handleFileSelect(e.target.files)} />
                            </div>
                        </div>
                    </div>

                    {pendingFiles.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 pt-2">
                            {pendingFiles.map((pf, i) => (
                                <div key={i} className="relative group rounded-xl overflow-hidden border border-border/40 bg-muted/40 aspect-square">
                                    {pf.type === "image" ? (
                                        <img src={pf.preview} alt={pf.file.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground px-1">
                                            <FileText className="h-6 w-6" />
                                            <span className="text-[8px] font-black text-center line-clamp-1 truncate w-full px-1 uppercase">{pf.file.name}</span>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removePendingFile(i)}
                                        className="absolute top-1 right-1 h-5 w-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-90"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <Button
                            type="button"
                            onClick={handleCreate}
                            disabled={creating || !form.title.trim()}
                            className="flex-1 h-12 rounded-xl btn-premium text-base font-black uppercase italic tracking-wider shadow-lg"
                        >
                            {creating ? (
                                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Salvando...</>
                            ) : (
                                "Criar Item Relevante"
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowForm(false)}
                            className="px-6 h-12 rounded-xl font-black uppercase text-xs tracking-widest text-muted-foreground hover:bg-muted"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Empty state ── */}
            {items.length === 0 && !showForm && (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/20 rounded-[2rem] bg-card/20 backdrop-blur-sm">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-6 opacity-40">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-black text-xl uppercase tracking-tighter italic text-muted-foreground/60">Quadro de Itens / Orçamentos</h3>
                    <p className="text-sm font-black text-muted-foreground/40 mt-1 uppercase tracking-widest">Aguardando seu primeiro lançamento</p>
                    {contractId && (
                        <Button
                            variant="link"
                            onClick={() => setShowForm(true)}
                            className="mt-6 text-primary font-black uppercase text-xs tracking-[0.2em] decoration-2"
                        >
                            Começar agora →
                        </Button>
                    )}
                </div>
            )}

            {/* ── Kanban ── */}
            {items.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {COLUMNS.map((col) => {
                            const colItems = items.filter((i) => col.status.includes(i.status));
                            return (
                                <KanbanCol key={col.id} column={col} count={colItems.length}>
                                    <SortableContext items={colItems.map((i) => i.id)}>
                                        <div className="space-y-4 min-h-[100px] p-1">
                                            {colItems.map((item) => (
                                                <DraggableItem key={item.id} item={item} onAttach={handleAttach} />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </KanbanCol>
                            );
                        })}
                    </div>

                    <DragOverlay>
                        {activeItem && <ItemCard item={activeItem} isDragging onAttach={handleAttach} />}
                    </DragOverlay>
                </DndContext>
            )}

            {/* ── Modal de Conclusão ── */}
            <Dialog open={!!itemToComplete} onOpenChange={(open) => !open && setItemToComplete(null)}>
                <DialogContent className="sm:max-w-[500px] border-border/40 shadow-2xl rounded-[2rem] overflow-hidden p-0 gap-0">
                    <div className="bg-primary p-8 text-white relative">
                        <DialogHeader className="space-y-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                                    <CheckCircle2 className="h-6 w-6 text-white" />
                                </div>
                                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Concluir Item</DialogTitle>
                            </div>
                            <p className="text-primary-foreground/80 font-bold uppercase text-xs tracking-widest pl-1">
                                Registro de Execução
                            </p>
                        </DialogHeader>
                        <Sparkles className="absolute top-6 right-8 h-12 w-12 text-white/10" />
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="bg-muted/40 p-4 rounded-2xl border border-border/20">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Item selecionado</p>
                            <p className="font-bold text-lg italic uppercase tracking-tight text-foreground">{itemToComplete?.title}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-black uppercase tracking-tighter text-foreground">Fotos da Execução (Obrigatório)</Label>
                                <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-lg">Mínimo 1 foto</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => completionCameraRef.current?.click()}
                                    className="h-20 rounded-2xl border-dashed border-2 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all group"
                                >
                                    <Camera className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Tirar Foto</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => completionFileRef.current?.click()}
                                    className="h-20 rounded-2xl border-dashed border-2 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all group"
                                >
                                    <Paperclip className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Galeria</span>
                                </Button>
                            </div>

                            <input
                                ref={completionCameraRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                capture="environment"
                                multiple
                                onChange={(e) => {
                                    const files = e.target.files;
                                    if (!files) return;
                                    const added = Array.from(files).map(f => ({
                                        file: f,
                                        preview: URL.createObjectURL(f),
                                        type: "image" as const
                                    }));
                                    setCompletionFiles(prev => [...prev, ...added]);
                                }}
                            />
                            <input
                                ref={completionFileRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                    const files = e.target.files;
                                    if (!files) return;
                                    const added = Array.from(files).map(f => ({
                                        file: f,
                                        preview: URL.createObjectURL(f),
                                        type: "image" as const
                                    }));
                                    setCompletionFiles(prev => [...prev, ...added]);
                                }}
                            />

                            {completionFiles.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 pt-2">
                                    {completionFiles.map((pf, i) => (
                                        <div key={i} className="relative group rounded-xl overflow-hidden border border-border/40 aspect-square">
                                            <img src={pf.preview} alt="preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCompletionFiles(prev => {
                                                        const copy = [...prev];
                                                        URL.revokeObjectURL(copy[i].preview);
                                                        copy.splice(i, 1);
                                                        return copy;
                                                    });
                                                }}
                                                className="absolute top-1 right-1 h-5 w-5 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="p-8 pt-0 flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={handleConfirmCompletion}
                            disabled={completing || completionFiles.length === 0}
                            className="flex-1 h-14 rounded-2xl btn-premium text-base font-black uppercase italic tracking-wider shadow-lg"
                        >
                            {completing ? (
                                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Finalizando...</>
                            ) : (
                                "Confirmar Conclusão"
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setItemToComplete(null);
                                setCompletionFiles([]);
                            }}
                            className="h-14 px-6 rounded-2xl font-black uppercase text-xs tracking-widest text-muted-foreground"
                        >
                            Cancelar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function KanbanCol({ column, count, children }: { column: KanbanColumn; count: number; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });
    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col rounded-[1.5rem] transition-all duration-300 ${isOver ? "bg-primary/5 ring-1 ring-primary/20 scale-[1.01]" : ""}`}
        >
            <div className={`${column.bgColor} rounded-2xl px-5 py-4 mb-4 flex items-center justify-between shadow-sm`}>
                <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${column.dotColor} animate-pulse shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
                    <span className={`text-xs font-black uppercase tracking-[0.2em] ${column.color}`}>{column.title}</span>
                </div>
                <div className={`px-2.5 py-1 rounded-lg bg-background/50 backdrop-blur-md text-xs font-black ${column.color} shadow-sm border border-white/5`}>
                    {count}
                </div>
            </div>
            {children}
        </div>
    );
}

function DraggableItem({ item, onAttach }: { item: RelevantItem; onAttach: (id: string, file: File) => Promise<void> }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1 }}
            className="group"
        >
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <ItemCard item={item} onAttach={onAttach} isDragging={isDragging} />
            </div>
        </div>
    );
}

function ItemCard({ item, isDragging, onAttach }: { item: RelevantItem; isDragging?: boolean; onAttach: (id: string, file: File) => Promise<void> }) {
    const { toast } = useToast();
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            await onAttach(item.id, file);
            toast({ title: "Arquivo anexado com sucesso!", variant: "success" });
        } catch {
            toast({ title: "Erro ao anexar arquivo", variant: "destructive" });
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const priorityMap: Record<string, { label: string; cls: string }> = {
        HIGH: { label: "Alta", cls: "bg-red-500/10 text-red-500 border-red-500/30" },
        MEDIUM: { label: "Média", cls: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
        LOW: { label: "Baixa", cls: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
    };
    const p = item.priority ? priorityMap[item.priority] : null;

    return (
        <Card className={`card-premium overflow-hidden transition-all duration-300 ${isDragging ? "opacity-0" : "hover:shadow-xl hover:scale-[1.02] active:scale-95 group-hover:border-primary/30"}`}>
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-sm font-black tracking-tight leading-snug uppercase italic">{item.title}</CardTitle>
                    {p && (
                        <span className={`shrink-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${p.cls}`}>
                            {p.label}
                        </span>
                    )}
                </div>
                {item.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-2 font-medium leading-relaxed">{item.description}</p>
                )}
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {item.value != null && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 shadow-sm">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                                R$ {Number(item.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                    {item.dueDate && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground px-2 py-1 rounded-lg bg-muted/40 border border-border/10">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(item.dueDate)}</span>
                        </div>
                    )}
                </div>

                {/* Anexos */}
                {(item.attachments.length > 0) && (
                    <div className="space-y-2">
                        {/* Imagens */}
                        {item.attachments.filter((a) => a.fileType === "image").length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                                {item.attachments.filter((a) => a.fileType === "image").map((att) => (
                                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="relative h-14 w-14 rounded-xl overflow-hidden border border-border/40 hover:scale-105 transition-transform shadow-sm group/att">
                                        <img src={att.url} alt={att.filename} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/att:opacity-100 transition-opacity flex items-center justify-center">
                                            <Upload className="h-3 w-3 text-white" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                        {/* Outros arquivos */}
                        {item.attachments.filter((a) => a.fileType !== "image").length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {item.attachments.filter((a) => a.fileType !== "image").map((att) => (
                                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-2 text-[10px] font-black uppercase bg-muted/60 px-3 py-1.5 rounded-xl border border-border/40 hover:bg-primary/5 hover:text-primary transition-all shadow-sm">
                                        <FileText className="h-3.5 w-3.5 opacity-60" />
                                        <span className="truncate max-w-[100px]">{att.filename}</span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20 shrink-0">
                            {item.user.name.charAt(0)}
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tighter">{item.user.name}</p>
                    </div>

                    <div onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                        <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFile} />
                        <div className="flex gap-1">
                            {item.history && item.history.length > 0 && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/5 hover:text-primary transition-all"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <History className="h-3 w-3" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-border/40 p-6">
                                        <DialogHeader>
                                            <DialogTitle className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2">
                                                <History className="h-5 w-5 text-primary" />
                                                Histórico do Item
                                            </DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            {item.history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((log, idx) => (
                                                <div key={log.id} className="relative pl-6 pb-4 border-l-2 border-primary/20 last:pb-0 last:border-l-0">
                                                    <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-primary flex items-center justify-center shadow-lg">
                                                        <Clock className="h-2 w-2 text-white" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-foreground">
                                                            {log.oldStatus ? (
                                                                <>Moveu de <span className="text-muted-foreground line-through opacity-50">{COLUMNS.find(c => c.status.includes(log.oldStatus || ""))?.title || log.oldStatus}</span> para <span className="text-primary">{COLUMNS.find(c => c.status.includes(log.newStatus))?.title || log.newStatus}</span></>
                                                            ) : (
                                                                <>Criou o item como <span className="text-primary">{COLUMNS.find(c => c.status.includes(log.newStatus))?.title || log.newStatus}</span></>
                                                            )}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                                                            <span>{log.user.name}</span>
                                                            <span className="opacity-30">•</span>
                                                            <span>{formatDate(log.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                                disabled={uploading}
                                className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest px-2.5 hover:bg-primary/5 hover:text-primary transition-all gap-1.5"
                            >
                                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
                                {uploading ? "..." : "Anexar"}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
