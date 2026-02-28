"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Download, Calendar, Building2, FileText, History, Clock, Loader2, Paperclip, Image, Camera, Plus, File } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    rectIntersection,
} from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";

type ReportHistory = {
    id: string;
    oldStatus: string | null;
    newStatus: string;
    createdAt: string | Date;
    user: { name: string };
};

type Photo = {
    id: string;
    url: string;
    filename: string;
};

type Report = {
    id: string;
    title: string;
    status: string;
    executionDate: Date;
    expirationDate: Date;
    contract: { name: string };
    asset: { name: string } | null;
    user: { name: string };
    photos?: Photo[];
    history?: ReportHistory[];
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
        id: "in_progress",
        title: "Em andamento",
        status: ["IN_PROGRESS"],
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10",
    },
    {
        id: "pending_approval",
        title: "Aguardando aprovação",
        status: ["PENDING_APPROVAL"],
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-500/10",
    },
    {
        id: "approved_execution",
        title: "Aprovado para execução",
        status: ["APPROVED_FOR_EXECUTION"],
        color: "text-cyan-600 dark:text-cyan-400",
        bgColor: "bg-cyan-500/10",
    },
    {
        id: "approved",
        title: "Em dia",
        status: ["APPROVED", "RENEWED"],
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-500/10",
    },
    {
        id: "expiring",
        title: "Próximo ao vencimento",
        status: ["EXPIRING_SOON"],
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-500/10",
    },
    {
        id: "expired",
        title: "Vencidos",
        status: ["EXPIRED"],
        color: "text-rose-600 dark:text-rose-400",
        bgColor: "bg-rose-500/10",
    },
];

function ReportCard({ report, onViewDetails, onAddPhoto, isUploadingPhoto }: { report: Report; onViewDetails: (id: string) => void; onAddPhoto: (reportId: string) => void; isUploadingPhoto: boolean; }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: report.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 50 : "auto",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`group relative bg-card border border-border/50 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-2xl ring-2 ring-primary/20 scale-105' : ''}`}
        >
            <div className="space-y-4">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-sm text-card-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {report.title}
                    </h3>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted border border-border/50">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                            {report.contract.name}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 px-1">
                        {report.asset && (
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                                <FileText className="h-3 w-3 opacity-70" />
                                <span className="truncate">{report.asset.name}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                            <Calendar className="h-3 w-3 opacity-70" />
                            <span>Venc: {formatDate(report.expirationDate)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-1.5 pt-1" onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onViewDetails(report.id); }}
                        className="flex-1 h-7 rounded-lg text-[10px] font-bold border-border/60 hover:bg-primary hover:text-primary-foreground transition-all duration-300 px-2"
                    >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Detalhes
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onAddPhoto(report.id); }}
                        disabled={isUploadingPhoto}
                        className="h-7 w-7 rounded-lg hover:bg-muted border border-transparent hover:border-border/60 p-0"
                        title="Adicionar arquivo"
                    >
                        {isUploadingPhoto ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Paperclip className="h-3 w-3" />
                        )}
                    </Button>
                    {report.photos && report.photos.length > 0 && (
                        <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <span className="text-[9px] font-black text-primary">{report.photos.length}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DroppableColumn({
    column,
    children,
    count,
}: {
    column: KanbanColumn;
    children: React.ReactNode;
    count: number;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col h-full min-w-[220px] rounded-2xl transition-all duration-300 ${isOver ? "bg-primary/5 ring-1 ring-primary/20" : ""
                }`}
        >
            <div className="px-4 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${column.bgColor.replace('bg-', 'bg-').split('/')[0]} shadow-lg animate-pulse`} />
                    <h2 className="text-sm font-bold tracking-tight text-foreground/80 lowercase first-letter:uppercase">
                        {column.title}
                    </h2>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${column.color} ${column.bgColor} border border-current/10 shadow-sm`}>
                    {count}
                </span>
            </div>

            <div className="flex-1 px-2 pb-6">
                <div className={`flex flex-col gap-3 min-h-[500px] p-2 rounded-[2rem] transition-colors duration-300 ${isOver ? 'bg-primary/5' : ''}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}

export function ReportsKanban({ initialReports = [] }: { initialReports: Report[] }) {
    const [reports, setReports] = useState(initialReports || []);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [uploadingPhotoForReport, setUploadingPhotoForReport] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Sync state when props change
    React.useEffect(() => {
        setReports(initialReports || []);
    }, [initialReports]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 8,
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

        const reportId = active.id as string;
        const overId = over.id as string;

        const column = columns.find((col) => col.id === overId);
        let newStatus: string | null = null;

        if (!column) {
            const targetReport = reports.find((r) => r.id === overId);
            if (!targetReport) {
                setActiveId(null);
                return;
            }

            const targetColumn = columns.find((col) =>
                col.status.includes(targetReport.status)
            );

            if (!targetColumn) {
                setActiveId(null);
                return;
            }

            newStatus = targetColumn.status[0];
        } else {
            newStatus = column.status[0];
        }

        // Atualização otimista ANTES de limpar activeId
        const oldReports = [...reports];
        setReports((prev) =>
            prev.map((report) =>
                report.id === reportId ? { ...report, status: newStatus! } : report
            )
        );

        setActiveId(null);

        // Agora faz a chamada API em background
        try {
            const response = await fetch(`/api/reports/${reportId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error("Failed to update status");
            }
        } catch (error) {
            console.error("Failed to update report status:", error);
            setReports(oldReports);
        }
    };


    const activeReport = reports.find((r) => r.id === activeId);

    const handleViewDetails = async (reportId: string) => {
        setLoadingDetail(true);
        try {
            const res = await fetch(`/api/reports/${reportId}`);
            if (!res.ok) throw new Error();
            const reportWithHistory = await res.json();
            setSelectedReport(reportWithHistory);
        } catch (error) {
            console.error("Error fetching report details:", error);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleUploadPhoto = async (reportId: string, file: File) => {
        setUploadingPhotoForReport(reportId);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`/api/reports/${reportId}/photos`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Falha no upload");

            const newPhoto = await res.json();

            // Atualizar o report no estado
            setReports((prev) =>
                prev.map((report) =>
                    report.id === reportId
                        ? { ...report, photos: [...(report.photos || []), newPhoto] }
                        : report
                )
            );

            // Se a modal está aberta, atualizar também
            if (selectedReport && selectedReport.id === reportId) {
                setSelectedReport({
                    ...selectedReport,
                    photos: [...(selectedReport.photos || []), newPhoto],
                });
            }

            toast({
                title: "Sucesso",
                description: "Arquivo adicionado ao laudo",
            });
        } catch (error) {
            console.error("Error uploading photo:", error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Falha ao fazer upload do arquivo",
            });
        } finally {
            setUploadingPhotoForReport(null);
        }
    };

    const triggerFileInput = (reportId: string) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                handleUploadPhoto(reportId, file);
            }
        };
        input.click();
    };

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-3 overflow-x-auto pb-8 scrollbar-hide px-1">
                {columns.map((column) => {
                    const columnReports = reports.filter((report) =>
                        column.status.includes(report.status)
                    );
                    return (
                        <DroppableColumn
                            key={column.id}
                            column={column}
                            count={columnReports.length}
                        >
                            <SortableContext items={columnReports.map((r) => r.id)}>
                                {columnReports.length > 0 ? (
                                    columnReports.map((report) => (
                                        <ReportCard
                                            key={report.id}
                                            report={report}
                                            onViewDetails={handleViewDetails}
                                            onAddPhoto={triggerFileInput}
                                            isUploadingPhoto={uploadingPhotoForReport === report.id}
                                        />
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-32 text-[10px] uppercase tracking-widest text-muted-foreground/40 border-2 border-dashed border-border/20 rounded-[1.5rem] bg-secondary/10">
                                        <History className="h-6 w-6 mb-2 opacity-20" />
                                        Sem registros
                                    </div>
                                )}
                            </SortableContext>
                        </DroppableColumn>
                    );
                })}
            </div>

            <DragOverlay dropAnimation={{
                duration: 250,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
                {activeReport ? (
                    <div className="bg-card border-2 border-primary/40 rounded-2xl p-4 shadow-2xl skew-x-1 scale-105 opacity-90 backdrop-blur-sm">
                        <h3 className="font-bold text-sm text-primary">{activeReport.title}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">{activeReport.contract.name}</p>
                    </div>
                ) : null}
            </DragOverlay>
            </DndContext>

            {/* Modal de Detalhes com Histórico */}
            <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
            <DialogContent className="sm:max-w-[700px] border-border/40 shadow-2xl rounded-[2.5rem] overflow-hidden p-0 gap-0">
                {selectedReport && (
                    <>
                        <div className="bg-card p-8 border-b border-border/40 relative">
                            <div className="flex justify-between items-start gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black uppercase bg-muted px-2 py-0.5 rounded-lg border border-border/40">
                                            {columns.find(c => c.status.includes(selectedReport.status))?.title || selectedReport.status}
                                        </span>
                                    </div>
                                    <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                                        {selectedReport.title}
                                    </DialogTitle>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                                    <FileText className="h-8 w-8 text-primary/40" />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 grid md:grid-cols-2 gap-8 overflow-y-auto max-h-[70vh]">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contrato</Label>
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/20">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-bold">{selectedReport.contract.name}</span>
                                        </div>
                                    </div>

                                    {selectedReport.asset && (
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ativo/Equipamento</Label>
                                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/20">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-bold">{selectedReport.asset.name}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data de Execução</Label>
                                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {formatDate(selectedReport.executionDate)}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vencimento</Label>
                                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {formatDate(selectedReport.expirationDate)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Responsável</Label>
                                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                            {selectedReport.user.name}
                                        </div>
                                    </div>
                                </div>

                                {/* Fotos/Anexos */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fotos e Documentos</Label>
                                        <div className="flex items-center gap-2">
                                            {selectedReport.photos && selectedReport.photos.length > 0 && (
                                                <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-lg">
                                                    {selectedReport.photos.length} {selectedReport.photos.length === 1 ? 'arquivo' : 'arquivos'}
                                                </span>
                                            )}
                                            <Button
                                                onClick={() => triggerFileInput(selectedReport.id)}
                                                disabled={uploadingPhotoForReport === selectedReport.id}
                                                size="sm"
                                                className="h-7 rounded-lg text-[10px] font-black uppercase"
                                            >
                                                {uploadingPhotoForReport === selectedReport.id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Paperclip className="h-3 w-3 mr-1" />
                                                        Adicionar
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {selectedReport.photos && selectedReport.photos.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {selectedReport.photos.map((photo) => {
                                                const isImage = photo.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                                                const isPDF = photo.filename.match(/\.pdf$/i);
                                                const isDoc = photo.filename.match(/\.(doc|docx)$/i);
                                                const isExcel = photo.filename.match(/\.(xls|xlsx)$/i);

                                                return (
                                                    <div key={photo.id} className="group relative rounded-2xl border border-border/40 overflow-hidden bg-card transition-all hover:border-primary/40 shadow-sm">
                                                        <div className="aspect-video w-full bg-muted overflow-hidden flex items-center justify-center">
                                                            {isImage ? (
                                                                <img src={photo.url} alt={photo.filename} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-2">
                                                                    {isPDF && <FileText className="h-10 w-10 text-red-500" />}
                                                                    {isDoc && <FileText className="h-10 w-10 text-blue-500" />}
                                                                    {isExcel && <FileText className="h-10 w-10 text-green-500" />}
                                                                    {!isPDF && !isDoc && !isExcel && <File className="h-10 w-10 text-muted-foreground" />}
                                                                    <span className="text-[9px] font-black uppercase text-muted-foreground">
                                                                        {photo.filename.split('.').pop()?.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="p-3 flex items-center justify-between gap-2">
                                                            <span className="text-[10px] font-black uppercase truncate flex-1 opacity-60">{photo.filename}</span>
                                                            <a
                                                                href={photo.url}
                                                                download={photo.filename}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
                                                            >
                                                                <Download className="h-3 w-3" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-border/20 rounded-2xl bg-muted/5">
                                            <Paperclip className="h-8 w-8 mb-2 text-muted-foreground/20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Nenhum arquivo adicionado</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <Link href={`/reports/${selectedReport.id}`}>
                                        <Button className="w-full h-12 rounded-xl btn-premium text-sm font-black uppercase">
                                            <Eye className="h-4 w-4 mr-2" />
                                            Ver Laudo Completo
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            <div className="space-y-6 border-l border-border/20 pl-8">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <History className="h-3 w-3" /> Linha do Tempo
                                </Label>
                                {selectedReport.history && selectedReport.history.length > 0 ? (
                                    <div className="space-y-6 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-muted/60">
                                        {selectedReport.history.map((log) => (
                                            <div key={log.id} className="relative pl-8 animate-in fade-in slide-in-from-left-2 transition-all">
                                                <div className="absolute left-0 top-0.5 h-4.5 w-4.5 rounded-full bg-card border-2 border-primary flex items-center justify-center z-10 shadow-sm">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold leading-tight">
                                                        {log.oldStatus ? (
                                                            <>
                                                                Moveu de <span className="text-muted-foreground/50 line-through lowercase italic">{columns.find(c => c.status.includes(log.oldStatus || ""))?.title || log.oldStatus}</span> para <span className="text-primary italic">{columns.find(c => c.status.includes(log.newStatus))?.title || log.newStatus}</span>
                                                            </>
                                                        ) : (
                                                            <>Criou o laudo como <span className="text-primary italic">{columns.find(c => c.status.includes(log.newStatus))?.title || log.newStatus}</span></>
                                                        )}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                                        <span>{log.user.name}</span>
                                                        <span>•</span>
                                                        <span>{formatDate(log.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border/20 rounded-3xl opacity-40">
                                        <Clock className="h-8 w-8 mb-2 text-muted-foreground" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sem histórico</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="p-8 pt-4 border-t border-border/20 bg-muted/5">
                            <Button
                                variant="ghost"
                                onClick={() => setSelectedReport(null)}
                                className="h-12 px-8 rounded-2xl font-black uppercase text-xs tracking-widest"
                            >
                                Fechar
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
            </Dialog>
        </>
    );
}
