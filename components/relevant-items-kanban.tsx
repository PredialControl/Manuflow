"use client";

import React, { useState, useRef } from "react";
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
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

type Attachment = {
    id: string;
    url: string;
    filename: string;
    fileType: string;
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

interface RelevantItemsKanbanProps {
    initialItems: RelevantItem[];
    contractId?: string;
}

type PendingFile = {
    file: File;
    preview: string;
    type: "image" | "pdf" | "document";
};

export function RelevantItemsKanban({ initialItems, contractId }: RelevantItemsKanbanProps) {
    const { toast } = useToast();
    const [items, setItems] = useState<RelevantItem[]>(initialItems);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

    const [newItem, setNewItem] = useState({
        title: "",
        description: "",
        priority: "MEDIUM",
        value: "",
        dueDate: "",
        notes: "",
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
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

        try {
            const res = await fetch(`/api/relevant-items/${activeItem.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error();
            const updated = await res.json();
            setItems((prev) => prev.map((i) => (i.id === activeItem.id ? updated : i)));
            toast({ title: "Status atualizado!", description: `Movido para ${overColumn.title}`, variant: "success" });
        } catch {
            toast({ title: "Erro", description: "Não foi possível atualizar", variant: "destructive" });
        }
    };

    // ── Seleção de arquivos pendentes ────────────────────────────
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
    const handleCreateItem = async () => {
        if (!newItem.title.trim()) {
            toast({ title: "Erro", description: "Título é obrigatório", variant: "destructive" });
            return;
        }
        if (!contractId) {
            toast({ title: "Erro", description: "Contrato não identificado", variant: "destructive" });
            return;
        }

        setCreating(true);
        try {
            // 1. Cria o item
            const res = await fetch("/api/relevant-items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...newItem, contractId }),
            });
            if (!res.ok) throw new Error("Falha ao criar item");
            let item = await res.json();

            // 2. Faz upload de cada arquivo pendente
            for (const pf of pendingFiles) {
                const form = new FormData();
                form.append("file", pf.file);
                const attRes = await fetch(`/api/relevant-items/${item.id}/attachments`, {
                    method: "POST",
                    body: form,
                });
                if (attRes.ok) {
                    const att = await attRes.json();
                    item = { ...item, attachments: [...(item.attachments ?? []), att] };
                }
            }

            setItems((prev) => [item, ...prev]);
            resetDialog();
            setIsDialogOpen(false);
            toast({ title: "Item criado!", description: "Item relevante adicionado com sucesso", variant: "success" });
        } catch (err: any) {
            toast({ title: "Erro", description: err?.message ?? "Não foi possível criar o item", variant: "destructive" });
        } finally {
            setCreating(false);
        }
    };

    // ── Anexar em item existente ─────────────────────────────────
    const handleAttach = async (itemId: string, file: File) => {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`/api/relevant-items/${itemId}/attachments`, { method: "POST", body: form });
        if (!res.ok) throw new Error();
        const att = await res.json();
        setItems((prev) =>
            prev.map((i) => (i.id === itemId ? { ...i, attachments: [...i.attachments, att] } : i))
        );
    };

    const resetDialog = () => {
        setNewItem({ title: "", description: "", priority: "MEDIUM", value: "", dueDate: "", notes: "" });
        pendingFiles.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
        setPendingFiles([]);
    };

    const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black tracking-tight uppercase">Itens Relevantes</h2>
                    <p className="text-sm text-muted-foreground font-bold">
                        Gerencie orçamentos, aprovações e itens importantes
                    </p>
                </div>

                {contractId && (
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetDialog();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="btn-premium">
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Item
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-[560px] rounded-[2rem] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Novo Item Relevante</DialogTitle>
                                <DialogDescription>Adicione fotos, PDFs e o valor estimado</DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-5 py-2">
                                {/* Título */}
                                <div className="space-y-2">
                                    <Label htmlFor="ri-title">Título *</Label>
                                    <Input
                                        id="ri-title"
                                        value={newItem.title}
                                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                        placeholder="Ex: Conserto do ar condicionado"
                                    />
                                </div>

                                {/* Descrição */}
                                <div className="space-y-2">
                                    <Label htmlFor="ri-description">Descrição</Label>
                                    <Textarea
                                        id="ri-description"
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        placeholder="Detalhes do problema ou serviço..."
                                        rows={3}
                                    />
                                </div>

                                {/* Prioridade + Valor */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Prioridade</Label>
                                        <Select
                                            value={newItem.priority}
                                            onValueChange={(val) => setNewItem({ ...newItem, priority: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="LOW">🟢 Baixa</SelectItem>
                                                <SelectItem value="MEDIUM">🟡 Média</SelectItem>
                                                <SelectItem value="HIGH">🔴 Alta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ri-value">Valor estimado (R$)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">R$</span>
                                            <Input
                                                id="ri-value"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={newItem.value}
                                                onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                                                placeholder="0,00"
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Prazo */}
                                <div className="space-y-2">
                                    <Label htmlFor="ri-dueDate">Prazo</Label>
                                    <Input
                                        id="ri-dueDate"
                                        type="date"
                                        value={newItem.dueDate}
                                        onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                                    />
                                </div>

                                {/* Upload de arquivos */}
                                <div className="space-y-3">
                                    <Label>Fotos e Documentos</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 gap-2 rounded-xl border-dashed hover:border-primary hover:bg-primary/5"
                                            onClick={() => cameraInputRef.current?.click()}
                                        >
                                            <Camera className="h-4 w-4" />
                                            Câmera / Foto
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 gap-2 rounded-xl border-dashed hover:border-primary hover:bg-primary/5"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Paperclip className="h-4 w-4" />
                                            PDF / Arquivo
                                        </Button>
                                    </div>

                                    {/* Inputs ocultos */}
                                    <input
                                        ref={cameraInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        capture="environment"
                                        multiple
                                        onChange={(e) => handleFileSelect(e.target.files)}
                                    />
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*,.pdf,.doc,.docx"
                                        multiple
                                        onChange={(e) => handleFileSelect(e.target.files)}
                                    />

                                    {/* Previews */}
                                    {pendingFiles.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2">
                                            {pendingFiles.map((pf, i) => (
                                                <div key={i} className="relative group rounded-xl overflow-hidden border border-border/60 bg-muted/40">
                                                    {pf.type === "image" ? (
                                                        <img src={pf.preview} alt={pf.file.name} className="w-full h-20 object-cover" />
                                                    ) : (
                                                        <div className="w-full h-20 flex flex-col items-center justify-center gap-1 text-muted-foreground px-1">
                                                            <FileText className="h-7 w-7" />
                                                            <span className="text-[9px] font-bold text-center line-clamp-2">{pf.file.name}</span>
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removePendingFile(i)}
                                                        className="absolute top-1 right-1 h-5 w-5 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {pendingFiles.length > 0 && (
                                        <p className="text-xs text-muted-foreground font-bold">
                                            {pendingFiles.length} arquivo{pendingFiles.length > 1 ? "s" : ""} selecionado{pendingFiles.length > 1 ? "s" : ""}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    onClick={handleCreateItem}
                                    className="w-full btn-premium"
                                    disabled={creating || !newItem.title.trim()}
                                >
                                    {creating ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</>
                                    ) : (
                                        <><CheckCircle2 className="h-4 w-4 mr-2" /> Criar Item</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Empty state */}
            {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/40 rounded-2xl">
                    <AlertCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="font-bold text-muted-foreground text-sm uppercase tracking-widest">Nenhum item relevante</p>
                    {contractId && (
                        <p className="text-xs text-muted-foreground mt-1">Clique em &quot;Novo Item&quot; para começar</p>
                    )}
                </div>
            )}

            {/* Kanban */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {COLUMNS.map((col) => {
                        const colItems = items.filter((i) => col.status.includes(i.status));
                        return (
                            <KanbanCol key={col.id} column={col} count={colItems.length}>
                                <SortableContext items={colItems.map((i) => i.id)}>
                                    <div className="space-y-3 min-h-[60px]">
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
        </div>
    );
}

// ── Coluna droppable ─────────────────────────────────────────────
function KanbanCol({
    column,
    count,
    children,
}: {
    column: KanbanColumn;
    count: number;
    children: React.ReactNode;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col rounded-2xl transition-all duration-150 ${isOver ? "ring-2 ring-primary/30 bg-primary/5" : ""}`}
        >
            {/* Cabeçalho da coluna */}
            <div className={`${column.bgColor} rounded-xl px-4 py-3 mb-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${column.dotColor}`} />
                    <span className={`text-xs font-black uppercase tracking-widest ${column.color}`}>
                        {column.title}
                    </span>
                </div>
                <span className={`text-sm font-black ${column.color}`}>{count}</span>
            </div>
            {children}
        </div>
    );
}

// ── Item arrastável ──────────────────────────────────────────────
function DraggableItem({ item, onAttach }: { item: RelevantItem; onAttach: (id: string, file: File) => Promise<void> }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
            {...attributes}
            {...listeners}
        >
            <ItemCard item={item} onAttach={onAttach} />
        </div>
    );
}

// ── Card do item ─────────────────────────────────────────────────
function ItemCard({
    item,
    isDragging,
    onAttach,
}: {
    item: RelevantItem;
    isDragging?: boolean;
    onAttach: (id: string, file: File) => Promise<void>;
}) {
    const { toast } = useToast();
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            await onAttach(item.id, file);
            toast({ title: "Arquivo anexado!", variant: "success" });
        } catch {
            toast({ title: "Erro ao anexar arquivo", variant: "destructive" });
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const priorityMap: Record<string, { label: string; cls: string }> = {
        HIGH: { label: "Alta", cls: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" },
        MEDIUM: { label: "Média", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400" },
        LOW: { label: "Baixa", cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" },
    };
    const p = item.priority ? priorityMap[item.priority] : null;

    return (
        <Card className={`card-premium cursor-grab active:cursor-grabbing ${isDragging ? "shadow-2xl rotate-1 scale-105" : ""}`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black tracking-tight leading-snug">{item.title}</CardTitle>
                {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                )}
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
                {/* Valor */}
                {item.value != null && (
                    <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                            R$ {Number(item.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                )}

                {/* Prazo */}
                {item.dueDate && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(item.dueDate)}</span>
                    </div>
                )}

                {/* Prioridade */}
                {p && (
                    <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${p.cls}`}>
                        {p.label}
                    </span>
                )}

                {/* Fotos em miniatura */}
                {item.attachments.filter((a) => a.fileType === "image").length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                        {item.attachments.filter((a) => a.fileType === "image").map((att) => (
                            <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img
                                    src={att.url}
                                    alt={att.filename}
                                    className="h-12 w-12 rounded-lg object-cover border border-border/40 hover:scale-105 transition-transform"
                                />
                            </a>
                        ))}
                    </div>
                )}

                {/* PDFs e documentos */}
                {item.attachments.filter((a) => a.fileType !== "image").length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {item.attachments.filter((a) => a.fileType !== "image").map((att) => (
                            <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-[10px] font-bold bg-muted px-2 py-1 rounded-lg border border-border/40 hover:bg-primary/10 hover:border-primary/30 transition-colors"
                            >
                                <FileText className="h-3 w-3" />
                                <span className="truncate max-w-[80px]">{att.filename}</span>
                            </a>
                        ))}
                    </div>
                )}

                {/* Rodapé */}
                <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-2">
                    <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {item.user.name}
                    </p>
                    <div onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                        <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFile} />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] font-bold gap-1 shrink-0"
                            onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                            disabled={uploading}
                        >
                            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                            {uploading ? "..." : "Anexar"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
