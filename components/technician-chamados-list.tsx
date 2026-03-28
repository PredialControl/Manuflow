"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Wrench, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
    Camera, Loader2, X, Upload, ImageIcon, Star, Package, Link as LinkIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// ─── Categorias do que foi executado ──────────────────────────────────────────
const EXECUTION_CATEGORIES = [
    "Manutenção Preventiva",
    "Manutenção Corretiva",
    "Troca de Peça",
    "Limpeza e Higienização",
    "Reparo Elétrico",
    "Reparo Mecânico",
    "Regulagem / Calibração",
    "Inspeção Técnica",
    "Instalação",
    "Outro",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_LABEL: Record<string, string> = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    CRITICAL: "Crítica",
};
const PRIORITY_COLOR: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-600",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
};
const STATUS_LABEL: Record<string, string> = {
    OPEN: "Aberto",
    IN_PROGRESS: "Em Atendimento",
    WAITING_PARTS: "Ag. Peças",
    WAITING_APPROVAL: "Ag. Aprovação",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
    OPEN: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    WAITING_PARTS: "bg-orange-100 text-orange-800",
    WAITING_APPROVAL: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-600",
};

// ─── Photo uploader helper ──────────────────────────────────────────────────
function PhotoUploadSlot({
    label,
    value,
    onChange,
    chamadoId,
    type,
}: {
    label: string;
    value: string | null;
    onChange: (url: string) => void;
    chamadoId: string;
    type: "pre" | "execution";
}) {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleFile(file: File) {
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("photo", file);
            fd.append("type", type);
            fd.append("chamadoId", chamadoId);
            const res = await fetch("/api/chamados/photos", { method: "POST", body: fd });
            if (!res.ok) throw new Error("Falha no upload");
            const { url } = await res.json();
            onChange(url);
        } catch (e) {
            alert("Erro ao fazer upload da foto. Tente novamente.");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div
            onClick={() => !uploading && inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all h-32
                ${value ? "border-green-400 bg-green-50" : "border-border hover:border-primary hover:bg-muted/50"}
                ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                }}
            />
            {uploading ? (
                <>
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Enviando...</span>
                </>
            ) : value ? (
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={value} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-80" />
                    <div className="relative z-10 bg-green-500 text-white rounded-full p-1">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="relative z-10 text-xs font-semibold text-green-800 bg-green-100 px-2 py-0.5 rounded-full">
                        {label}
                    </span>
                </>
            ) : (
                <>
                    <Camera className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground text-center px-2">{label}</span>
                </>
            )}
        </div>
    );
}

// ─── Modal: Iniciar Chamado ──────────────────────────────────────────────────
function IniciarModal({
    chamado,
    open,
    onClose,
    onSuccess,
}: {
    chamado: any;
    open: boolean;
    onClose: () => void;
    onSuccess: (updated: any) => void;
}) {
    const [photos, setPhotos] = useState<[string | null, string | null]>([null, null]);
    const [saving, setSaving] = useState(false);

    const filledPhotos = photos.filter(Boolean);

    async function handleIniciar() {
        if (filledPhotos.length === 0) {
            alert("Adicione ao menos 1 foto antes de iniciar.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`/api/chamados/${chamado.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "IN_PROGRESS",
                    preExecutionPhotos: filledPhotos,
                }),
            });
            if (!res.ok) throw new Error("Falha ao atualizar chamado");
            const updated = await res.json();
            onSuccess(updated);
            onClose();
        } catch {
            alert("Erro ao iniciar chamado. Tente novamente.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-blue-500" />
                        Iniciar Atendimento
                    </DialogTitle>
                    <DialogDescription>
                        Fotografe o equipamento <strong>antes</strong> de começar o serviço.
                        Mínimo 1 foto, máximo 2.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        {chamado.title}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <PhotoUploadSlot
                            label="Foto antes 1"
                            value={photos[0]}
                            onChange={url => setPhotos(p => [url, p[1]])}
                            chamadoId={chamado.id}
                            type="pre"
                        />
                        <PhotoUploadSlot
                            label="Foto antes 2 (opcional)"
                            value={photos[1]}
                            onChange={url => setPhotos(p => [p[0], url])}
                            chamadoId={chamado.id}
                            type="pre"
                        />
                    </div>
                    {filledPhotos.length > 0 && (
                        <p className="text-xs text-green-600 font-medium text-center">
                            ✓ {filledPhotos.length} foto{filledPhotos.length > 1 ? "s" : ""} adicionada{filledPhotos.length > 1 ? "s" : ""}
                        </p>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleIniciar}
                        disabled={saving || filledPhotos.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Iniciar Atendimento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Modal: Concluir Chamado ──────────────────────────────────────────────────
function ConcluirModal({
    chamado,
    open,
    onClose,
    onSuccess,
}: {
    chamado: any;
    open: boolean;
    onClose: () => void;
    onSuccess: (updated: any) => void;
}) {
    const [photo, setPhoto] = useState<string | null>(null);
    const [category, setCategory] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleConcluir() {
        if (!photo) {
            alert("Adicione a foto da execução antes de concluir.");
            return;
        }
        if (!category) {
            alert("Selecione o que foi executado.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`/api/chamados/${chamado.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "COMPLETED",
                    executionPhotos: [photo],
                    executionCategory: category,
                    executionNotes: notes || null,
                }),
            });
            if (!res.ok) throw new Error("Falha ao concluir chamado");
            const updated = await res.json();
            onSuccess(updated);
            onClose();
        } catch {
            alert("Erro ao concluir chamado. Tente novamente.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        Concluir Atendimento
                    </DialogTitle>
                    <DialogDescription>
                        Foto do serviço executado, o que foi feito e observações.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        {chamado.title}
                    </p>

                    {/* Foto de execução */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider">
                            Foto da execução <span className="text-red-500">*</span>
                        </Label>
                        <div className="grid grid-cols-1">
                            <PhotoUploadSlot
                                label="Tire ou selecione uma foto do serviço"
                                value={photo}
                                onChange={setPhoto}
                                chamadoId={chamado.id}
                                type="execution"
                            />
                        </div>
                    </div>

                    {/* O que foi feito */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider">
                            O que foi feito <span className="text-red-500">*</span>
                        </Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de serviço..." />
                            </SelectTrigger>
                            <SelectContent>
                                {EXECUTION_CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Observações adicionais */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider">
                            Observações adicionais
                        </Label>
                        <Textarea
                            placeholder="Ex: Substituída bateria de 12V, terminais limpos com álcool..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            className="text-sm resize-none"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConcluir}
                        disabled={saving || !photo || !category}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Concluir Chamado
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Modal: Aguardando Material ────────────────────────────────────────────────
function AguardandoMaterialModal({
    chamado,
    open,
    onClose,
    onSuccess,
}: {
    chamado: any;
    open: boolean;
    onClose: () => void;
    onSuccess: (updated: any) => void;
}) {
    const [material, setMaterial] = useState("");
    const [photo, setPhoto] = useState<string | null>(null);
    const [link, setLink] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleAguardar() {
        if (!material.trim()) {
            alert("Descreva qual material/peça está aguardando.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`/api/chamados/${chamado.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "WAITING_PARTS",
                    waitingMaterial: material.trim(),
                    waitingMaterialPhoto: photo || null,
                    waitingMaterialLink: link.trim() || null,
                }),
            });
            if (!res.ok) throw new Error("Falha ao atualizar chamado");
            const updated = await res.json();
            onSuccess(updated);
            onClose();
        } catch {
            alert("Erro ao atualizar chamado. Tente novamente.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-orange-500" />
                        Aguardando Material
                    </DialogTitle>
                    <DialogDescription>
                        Informe qual peça ou material está aguardando para continuar o serviço.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider truncate">
                        {chamado.title}
                    </p>

                    {/* O que precisa */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider">
                            Material / Peça necessária <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            placeholder="Ex: Filtro de ar 20x25x1, Correia do ventilador modelo X, Fusível 10A..."
                            value={material}
                            onChange={e => setMaterial(e.target.value)}
                            rows={3}
                            className="text-sm resize-none"
                        />
                    </div>

                    {/* Foto do material */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider">
                            Foto do material / referência
                        </Label>
                        <PhotoUploadSlot
                            label="Foto da peça, etiqueta ou referência"
                            value={photo}
                            onChange={setPhoto}
                            chamadoId={chamado.id}
                            type="pre"
                        />
                    </div>

                    {/* Link */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                            Link (opcional)
                        </Label>
                        <Input
                            placeholder="Ex: https://mercadolivre.com/item/..."
                            value={link}
                            onChange={e => setLink(e.target.value)}
                            className="text-sm"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAguardar}
                        disabled={saving || !material.trim()}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Confirmar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Card do chamado ──────────────────────────────────────────────────────────
function ChamadoCard({
    chamado,
    onUpdate,
}: {
    chamado: any;
    onUpdate: (updated: any) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [showIniciarModal, setShowIniciarModal] = useState(false);
    const [showConcluirModal, setShowConcluirModal] = useState(false);
    const [showAguardandoModal, setShowAguardandoModal] = useState(false);

    const isOpen = chamado.status === "OPEN";
    const isInProgress = chamado.status === "IN_PROGRESS";
    const isWaitingParts = chamado.status === "WAITING_PARTS";
    const isWaitingApproval = chamado.status === "WAITING_APPROVAL";
    const isActive = isInProgress || isWaitingParts || isWaitingApproval;
    const isCompleted = chamado.status === "COMPLETED" || chamado.status === "CANCELLED";

    return (
        <>
            <div className={`border rounded-xl overflow-hidden transition-all ${isCompleted ? "opacity-60" : "hover:shadow-md"}`}>
                {/* Header clicável */}
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="w-full text-left p-4 flex items-start gap-3"
                >
                    {/* Ícone de status */}
                    <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                        ${isOpen ? "bg-yellow-100" : isWaitingParts ? "bg-orange-100" : isActive ? "bg-blue-100" : "bg-green-100"}`}>
                        {isOpen && <Clock className="w-4 h-4 text-yellow-600" />}
                        {isWaitingParts && <Package className="w-4 h-4 text-orange-600" />}
                        {(isInProgress || isWaitingApproval) && <Wrench className="w-4 h-4 text-blue-600" />}
                        {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm leading-tight">{chamado.title}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${PRIORITY_COLOR[chamado.priority] || "bg-gray-100 text-gray-600"}`}>
                                {PRIORITY_LABEL[chamado.priority] || chamado.priority}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[chamado.status] || "bg-gray-100"}`}>
                                {STATUS_LABEL[chamado.status] || chamado.status}
                            </span>
                            {chamado.contract?.name && (
                                <span className="text-[11px] text-muted-foreground">{chamado.contract.name}</span>
                            )}
                            {chamado.asset?.name && (
                                <span className="text-[11px] text-muted-foreground">• {chamado.asset.name}</span>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            {format(new Date(chamado.openedAt || chamado.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                    </div>

                    <div className="flex-shrink-0 text-muted-foreground">
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </button>

                {/* Expanded details */}
                {expanded && (
                    <div className="px-4 pb-4 space-y-4 border-t pt-3">
                        {chamado.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">{chamado.description}</p>
                        )}

                        {/* Fotos pré-execução já enviadas */}
                        {chamado.preExecutionPhotos?.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fotos (antes)</p>
                                <div className="flex gap-2 flex-wrap">
                                    {chamado.preExecutionPhotos.map((url: string, i: number) => (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img key={i} src={url} alt={`Antes ${i + 1}`}
                                            className="h-16 w-16 object-cover rounded-lg border" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Fotos de execução + conclusão */}
                        {chamado.executionPhotos?.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fotos (execução)</p>
                                <div className="flex gap-2 flex-wrap">
                                    {chamado.executionPhotos.map((url: string, i: number) => (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img key={i} src={url} alt={`Execução ${i + 1}`}
                                            className="h-16 w-16 object-cover rounded-lg border" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {chamado.executionCategory && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                                <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Serviço executado</p>
                                <p className="text-sm font-semibold text-green-900">{chamado.executionCategory}</p>
                                {chamado.executionNotes && (
                                    <p className="text-sm text-green-700">{chamado.executionNotes}</p>
                                )}
                            </div>
                        )}

                        {/* Info de material aguardando */}
                        {chamado.waitingMaterial && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
                                <p className="text-xs font-bold text-orange-800 uppercase tracking-wider flex items-center gap-1">
                                    <Package className="w-3 h-3" /> Material aguardando
                                </p>
                                <p className="text-sm text-orange-900">{chamado.waitingMaterial}</p>
                                {chamado.waitingMaterialPhoto && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={chamado.waitingMaterialPhoto} alt="Material"
                                        className="h-16 w-16 object-cover rounded-lg border border-orange-200" />
                                )}
                                {chamado.waitingMaterialLink && (
                                    <a href={chamado.waitingMaterialLink} target="_blank" rel="noopener noreferrer"
                                        className="text-xs text-blue-600 underline flex items-center gap-1">
                                        <LinkIcon className="w-3 h-3" />
                                        {chamado.waitingMaterialLink.slice(0, 50)}...
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Botões de ação */}
                        {!isCompleted && (
                            <div className="flex gap-2 pt-1 flex-wrap">
                                {isOpen && (
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                        onClick={() => setShowIniciarModal(true)}
                                    >
                                        <Wrench className="w-4 h-4 mr-2" />
                                        Iniciar
                                    </Button>
                                )}
                                {(isInProgress || isWaitingParts) && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-orange-400 text-orange-700 hover:bg-orange-50 font-bold"
                                            onClick={() => setShowAguardandoModal(true)}
                                        >
                                            <Package className="w-4 h-4 mr-1.5" />
                                            Ag. Material
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                                            onClick={() => setShowConcluirModal(true)}
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Concluir
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}

                        {isCompleted && chamado.completedAt && (
                            <p className="text-xs text-green-600 font-semibold">
                                ✓ Concluído em {format(new Date(chamado.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Modais */}
            {showIniciarModal && (
                <IniciarModal
                    chamado={chamado}
                    open={showIniciarModal}
                    onClose={() => setShowIniciarModal(false)}
                    onSuccess={updated => {
                        onUpdate(updated);
                        setExpanded(true);
                    }}
                />
            )}
            {showConcluirModal && (
                <ConcluirModal
                    chamado={chamado}
                    open={showConcluirModal}
                    onClose={() => setShowConcluirModal(false)}
                    onSuccess={updated => {
                        onUpdate(updated);
                        setExpanded(true);
                    }}
                />
            )}
            {showAguardandoModal && (
                <AguardandoMaterialModal
                    chamado={chamado}
                    open={showAguardandoModal}
                    onClose={() => setShowAguardandoModal(false)}
                    onSuccess={updated => {
                        onUpdate(updated);
                        setExpanded(true);
                    }}
                />
            )}
        </>
    );
}

// ─── Componente principal ──────────────────────────────────────────────────────
export function TechnicianChamadosList() {
    const [chamados, setChamados] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/chamados")
            .then(r => r.json())
            .then(data => {
                setChamados(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    function handleUpdate(updated: any) {
        setChamados(prev => prev.map(c => c.id === updated.id ? updated : c));
    }

    const open = chamados.filter(c => c.status === "OPEN");
    const inProgress = chamados.filter(c => ["IN_PROGRESS", "WAITING_PARTS", "WAITING_APPROVAL"].includes(c.status));
    const completed = chamados.filter(c => ["COMPLETED", "CANCELLED"].includes(c.status));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (chamados.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Wrench className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg">Nenhum chamado atribuído</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                    Você não tem chamados atribuídos no momento. Aguarde o administrador atribuir um chamado a você.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-xl mx-auto">
            {/* Em aberto */}
            {open.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <h2 className="font-black uppercase tracking-wider text-sm text-yellow-700">
                            Para atender ({open.length})
                        </h2>
                    </div>
                    {open.map(c => (
                        <ChamadoCard key={c.id} chamado={c} onUpdate={handleUpdate} />
                    ))}
                </section>
            )}

            {/* Em atendimento */}
            {inProgress.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-blue-600" />
                        <h2 className="font-black uppercase tracking-wider text-sm text-blue-700">
                            Em atendimento ({inProgress.length})
                        </h2>
                    </div>
                    {inProgress.map(c => (
                        <ChamadoCard key={c.id} chamado={c} onUpdate={handleUpdate} />
                    ))}
                </section>
            )}

            {/* Concluídos */}
            {completed.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <h2 className="font-black uppercase tracking-wider text-sm text-green-700">
                            Concluídos ({completed.length})
                        </h2>
                    </div>
                    {completed.map(c => (
                        <ChamadoCard key={c.id} chamado={c} onUpdate={handleUpdate} />
                    ))}
                </section>
            )}
        </div>
    );
}
