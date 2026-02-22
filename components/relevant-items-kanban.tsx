"use client";

import React, { useState } from "react";
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
    Paperclip,
    Upload,
    Image as ImageIcon,
    X,
    Download,
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

type RelevantItem = {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority?: string;
    dueDate?: Date | string;
    value?: number;
    notes?: string;
    contract: { name: string; company: string };
    user: { name: string };
    attachments: Array<{
        id: string;
        url: string;
        filename: string;
        fileType: string;
        user: { name: string };
    }>;
    createdAt: Date | string;
};

type KanbanColumn = {
    id: string;
    title: string;
    status: string[];
    color: string;
    bgColor: string;
};

const columns: KanbanColumn[] = [
    {
        id: "awaiting_budget",
        title: "Ag. Orçamentos",
        status: ["AWAITING_BUDGET"],
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10",
    },
    {
        id: "awaiting_approval",
        title: "Ag. Aprovação",
        status: ["AWAITING_APPROVAL"],
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-500/10",
    },
    {
        id: "approved",
        title: "Aprovados",
        status: ["APPROVED"],
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-500/10",
    },
    {
        id: "completed",
        title: "Concluídos",
        status: ["COMPLETED"],
        color: "text-slate-600 dark:text-slate-400",
        bgColor: "bg-slate-500/10",
    },
];

interface RelevantItemsKanbanProps {
    initialItems: RelevantItem[];
    contractId?: string;
}

export function RelevantItemsKanban({ initialItems, contractId }: RelevantItemsKanbanProps) {
    const { toast } = useToast();
    const [items, setItems] = useState<RelevantItem[]>(initialItems);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<RelevantItem | null>(null);
    const [uploading, setUploading] = useState(false);

    const [newItem, setNewItem] = useState({
        title: "",
        description: "",
        priority: "MEDIUM",
        value: "",
        dueDate: "",
        notes: "",
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeItem = items.find((item) => item.id === active.id);
        const overColumn = columns.find((col) => col.id === over.id);

        if (!activeItem || !overColumn) {
            setActiveId(null);
            return;
        }

        const newStatus = overColumn.status[0];

        if (activeItem.status !== newStatus) {
            try {
                const res = await fetch(`/api/relevant-items/${activeItem.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus }),
                });

                if (!res.ok) throw new Error();

                const updatedItem = await res.json();
                setItems(items.map((item) => (item.id === activeItem.id ? updatedItem : item)));

                toast({
                    title: "Status atualizado!",
                    description: `Item movido para ${overColumn.title}`,
                    variant: "success",
                });
            } catch (error) {
                toast({
                    title: "Erro",
                    description: "Não foi possível atualizar o status",
                    variant: "destructive",
                });
            }
        }

        setActiveId(null);
    };

    const handleCreateItem = async () => {
        if (!newItem.title || !contractId) {
            toast({
                title: "Erro",
                description: "Título é obrigatório",
                variant: "destructive",
            });
            return;
        }

        try {
            const res = await fetch("/api/relevant-items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newItem,
                    contractId,
                }),
            });

            if (!res.ok) throw new Error();

            const item = await res.json();
            setItems([item, ...items]);
            setNewItem({
                title: "",
                description: "",
                priority: "MEDIUM",
                value: "",
                dueDate: "",
                notes: "",
            });
            setIsDialogOpen(false);

            toast({
                title: "Sucesso!",
                description: "Item criado com sucesso",
                variant: "success",
            });
        } catch (error) {
            toast({
                title: "Erro",
                description: "Não foi possível criar o item",
                variant: "destructive",
            });
        }
    };

    const handleFileUpload = async (itemId: string, file: File) => {
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`/api/relevant-items/${itemId}/attachments`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error();

            const attachment = await res.json();

            // Update item with new attachment
            setItems(items.map((item) => {
                if (item.id === itemId) {
                    return {
                        ...item,
                        attachments: [...item.attachments, attachment],
                    };
                }
                return item;
            }));

            toast({
                title: "Arquivo enviado!",
                description: "Arquivo anexado com sucesso",
                variant: "success",
            });
        } catch (error) {
            toast({
                title: "Erro",
                description: "Não foi possível enviar o arquivo",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black tracking-tight uppercase">Itens Relevantes</h2>
                    <p className="text-sm text-muted-foreground font-bold">
                        Gerencie orçamentos, aprovações e itens importantes
                    </p>
                </div>
                {contractId && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="btn-premium">
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Criar Item Relevante</DialogTitle>
                                <DialogDescription>
                                    Adicione um novo item para acompanhamento
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Título *</Label>
                                    <Input
                                        id="title"
                                        value={newItem.title}
                                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                        placeholder="Ex: Conserto do ar condicionado"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Descrição</Label>
                                    <Textarea
                                        id="description"
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        placeholder="Detalhes do item..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Prioridade</Label>
                                        <Select
                                            value={newItem.priority}
                                            onValueChange={(val) => setNewItem({ ...newItem, priority: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="LOW">Baixa</SelectItem>
                                                <SelectItem value="MEDIUM">Média</SelectItem>
                                                <SelectItem value="HIGH">Alta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="value">Valor (R$)</Label>
                                        <Input
                                            id="value"
                                            type="number"
                                            step="0.01"
                                            value={newItem.value}
                                            onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Data de vencimento</Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        value={newItem.dueDate}
                                        onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateItem} className="w-full btn-premium">
                                    Criar Item
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {columns.map((column) => (
                        <DroppableColumn key={column.id} column={column}>
                            <div className="space-y-3">
                                {items
                                    .filter((item) => column.status.includes(item.status))
                                    .map((item) => (
                                        <DraggableItem
                                            key={item.id}
                                            item={item}
                                            onFileUpload={handleFileUpload}
                                            uploading={uploading}
                                        />
                                    ))}
                            </div>
                        </DroppableColumn>
                    ))}
                </div>

                <DragOverlay>
                    {activeItem && (
                        <ItemCard item={activeItem} isDragging onFileUpload={handleFileUpload} uploading={uploading} />
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

function DroppableColumn({ column, children }: { column: KanbanColumn; children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({ id: column.id });

    return (
        <div ref={setNodeRef} className="flex flex-col h-full">
            <div className={`${column.bgColor} rounded-xl p-4 mb-4`}>
                <h3 className={`text-sm font-black uppercase tracking-widest ${column.color}`}>
                    {column.title}
                </h3>
            </div>
            {children}
        </div>
    );
}

function DraggableItem({
    item,
    onFileUpload,
    uploading
}: {
    item: RelevantItem;
    onFileUpload: (itemId: string, file: File) => void;
    uploading: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <ItemCard item={item} onFileUpload={onFileUpload} uploading={uploading} />
        </div>
    );
}

function ItemCard({
    item,
    isDragging,
    onFileUpload,
    uploading,
}: {
    item: RelevantItem;
    isDragging?: boolean;
    onFileUpload: (itemId: string, file: File) => void;
    uploading: boolean;
}) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    return (
        <Card className={`card-premium ${isDragging ? "shadow-2xl" : ""}`}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-black tracking-tight">{item.title}</CardTitle>
                <p className="text-xs text-muted-foreground font-bold">{item.contract.company}</p>
            </CardHeader>
            <CardContent className="space-y-3">
                {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                )}

                {item.value && (
                    <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <span className="font-black">R$ {item.value.toFixed(2)}</span>
                    </div>
                )}

                {item.dueDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(item.dueDate)}</span>
                    </div>
                )}

                {item.priority && (
                    <span
                        className={`inline-block text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                            item.priority === "HIGH"
                                ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                : item.priority === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                        }`}
                    >
                        {item.priority === "HIGH" ? "Alta" : item.priority === "MEDIUM" ? "Média" : "Baixa"}
                    </span>
                )}

                {item.attachments.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                        {item.attachments.map((att) => (
                            <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded hover:bg-primary hover:text-white transition-colors"
                            >
                                {att.fileType === "image" ? (
                                    <ImageIcon className="h-3 w-3" />
                                ) : (
                                    <FileText className="h-3 w-3" />
                                )}
                                <span className="truncate max-w-[100px]">{att.filename}</span>
                            </a>
                        ))}
                    </div>
                )}

                <div className="pt-2 border-t">
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                onFileUpload(item.id, file);
                            }
                        }}
                        accept="image/*,.pdf,.doc,.docx"
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <Upload className="h-3 w-3 mr-1" />
                        {uploading ? "Enviando..." : "Anexar arquivo"}
                    </Button>
                </div>

                <p className="text-[10px] text-muted-foreground">
                    Por {item.user.name} • {formatDate(item.createdAt)}
                </p>
            </CardContent>
        </Card>
    );
}
