"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Download, Calendar, Building2, FileText, History } from "lucide-react";
import Link from "next/link";
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

type Report = {
    id: string;
    title: string;
    status: string;
    executionDate: Date;
    expirationDate: Date;
    contract: { name: string };
    asset: { name: string } | null;
    user: { name: string };
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
        id: "budget_pending",
        title: "Aguardando orçamento",
        status: ["BUDGET_PENDING"],
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-500/10",
    },
    {
        id: "budgeting",
        title: "Em orçamento",
        status: ["BUDGETING"],
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-500/10",
    },
    {
        id: "expired",
        title: "Vencidos",
        status: ["EXPIRED"],
        color: "text-rose-600 dark:text-rose-400",
        bgColor: "bg-rose-500/10",
    },
];

function ReportCard({ report }: { report: Report }) {
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

                <div className="flex gap-1.5 pt-1">
                    <Link href={`/reports/${report.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full h-7 rounded-lg text-[10px] font-bold border-border/60 hover:bg-primary hover:text-primary-foreground transition-all duration-300 px-2">
                            <Eye className="h-3 w-3 mr-1" />
                            Detalhes
                        </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="h-7 w-7 rounded-lg hover:bg-muted border border-transparent hover:border-border/60 p-0">
                        <Download className="h-3 w-3" />
                    </Button>
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

export function ReportsKanban({ initialReports }: { initialReports: Report[] }) {
    const [reports, setReports] = useState(initialReports);
    const [activeId, setActiveId] = useState<string | null>(null);

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

        const reportId = active.id as string;
        const overId = over.id as string;

        const column = columns.find((col) => col.id === overId);

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

            await updateReportStatus(reportId, targetColumn.status[0]);
        } else {
            await updateReportStatus(reportId, column.status[0]);
        }

        setActiveId(null);
    };

    const updateReportStatus = async (reportId: string, newStatus: string) => {
        setReports((prev) =>
            prev.map((report) =>
                report.id === reportId ? { ...report, status: newStatus } : report
            )
        );

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
            setReports(initialReports);
        }
    };

    const activeReport = reports.find((r) => r.id === activeId);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
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
                                        <ReportCard key={report.id} report={report} />
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
    );
}
