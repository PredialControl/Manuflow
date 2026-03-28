"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
    Shield, Wrench, Factory, Calendar, AlertTriangle,
    CheckCircle2, Clock, ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    assetId: string;
    installationDate?: string | null;
    warrantyExpiry?: string | null;
    isInExternalMaintenance?: boolean;
    externalCompany?: string | null;
    externalMaintenanceSince?: string | null;
    expectedReturnDate?: string | null;
    externalMaintenanceNotes?: string | null;
    canEdit?: boolean;
}

function formatDate(dateStr?: string | null) {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("pt-BR");
}

function getDaysUntil(dateStr?: string | null): number | null {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function AssetWarrantyBancada({
    assetId,
    installationDate: initInstallDate,
    warrantyExpiry: initWarrantyExpiry,
    isInExternalMaintenance: initInBancada = false,
    externalCompany: initExtCompany,
    externalMaintenanceSince: initExtSince,
    expectedReturnDate: initExpReturn,
    externalMaintenanceNotes: initExtNotes,
    canEdit = false,
}: Props) {
    const [saving, setSaving] = useState(false);
    const [showWarrantyEdit, setShowWarrantyEdit] = useState(false);
    const [showBancadaEdit, setShowBancadaEdit] = useState(false);

    // Garantia state
    const [installationDate, setInstallationDate] = useState(
        initInstallDate ? initInstallDate.split("T")[0] : ""
    );
    const [warrantyExpiry, setWarrantyExpiry] = useState(
        initWarrantyExpiry ? initWarrantyExpiry.split("T")[0] : ""
    );

    // Bancada state
    const [isInBancada, setIsInBancada] = useState(initInBancada);
    const [extCompany, setExtCompany] = useState(initExtCompany || "");
    const [extSince, setExtSince] = useState(
        initExtSince ? initExtSince.split("T")[0] : new Date().toISOString().split("T")[0]
    );
    const [expectedReturn, setExpectedReturn] = useState(
        initExpReturn ? initExpReturn.split("T")[0] : ""
    );
    const [extNotes, setExtNotes] = useState(initExtNotes || "");

    // Display values (current saved state)
    const [displayInstall, setDisplayInstall] = useState(initInstallDate);
    const [displayWarranty, setDisplayWarranty] = useState(initWarrantyExpiry);
    const [displayInBancada, setDisplayInBancada] = useState(initInBancada);
    const [displayExtCompany, setDisplayExtCompany] = useState(initExtCompany);
    const [displayExtSince, setDisplayExtSince] = useState(initExtSince);
    const [displayExpReturn, setDisplayExpReturn] = useState(initExpReturn);
    const [displayExtNotes, setDisplayExtNotes] = useState(initExtNotes);

    const warrantyDays = getDaysUntil(displayWarranty);
    const returnDays = getDaysUntil(displayExpReturn);

    async function saveWarranty() {
        setSaving(true);
        try {
            const res = await fetch(`/api/assets/${assetId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    installationDate: installationDate || null,
                    warrantyExpiry: warrantyExpiry || null,
                }),
            });
            if (res.ok) {
                setDisplayInstall(installationDate ? new Date(installationDate).toISOString() : null);
                setDisplayWarranty(warrantyExpiry ? new Date(warrantyExpiry).toISOString() : null);
                setShowWarrantyEdit(false);
                toast({ title: "Garantia atualizada!" });
            } else {
                toast({ title: "Erro ao salvar", variant: "destructive" });
            }
        } finally {
            setSaving(false);
        }
    }

    async function saveBancada(entering: boolean) {
        setSaving(true);
        try {
            const body = entering
                ? {
                    isInExternalMaintenance: true,
                    externalCompany: extCompany,
                    externalMaintenanceSince: extSince,
                    expectedReturnDate: expectedReturn || null,
                    externalMaintenanceNotes: extNotes || null,
                }
                : { isInExternalMaintenance: false };

            const res = await fetch(`/api/assets/${assetId}/bancada`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setIsInBancada(entering);
                setDisplayInBancada(entering);
                if (entering) {
                    setDisplayExtCompany(extCompany);
                    setDisplayExtSince(extSince ? new Date(extSince).toISOString() : null);
                    setDisplayExpReturn(expectedReturn ? new Date(expectedReturn).toISOString() : null);
                    setDisplayExtNotes(extNotes);
                } else {
                    setDisplayExtCompany(null);
                    setDisplayExtSince(null);
                    setDisplayExpReturn(null);
                    setDisplayExtNotes(null);
                }
                setShowBancadaEdit(false);
                toast({ title: entering ? "Equipamento enviado para bancada!" : "Equipamento retornou da bancada!" });
            } else {
                toast({ title: "Erro ao salvar", variant: "destructive" });
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            {/* === GARANTIA === */}
            <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            Garantia
                        </CardTitle>
                        {canEdit && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowWarrantyEdit(!showWarrantyEdit)}
                                className="rounded-xl text-[10px] font-black uppercase tracking-widest h-7 px-3"
                            >
                                {showWarrantyEdit ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                                {showWarrantyEdit ? "Fechar" : "Editar"}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Display */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/40 rounded-xl p-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                                Instalação
                            </p>
                            <p className={cn("text-sm font-black", displayInstall ? "text-foreground" : "text-muted-foreground/40")}>
                                {displayInstall ? formatDate(displayInstall) : "—"}
                            </p>
                        </div>
                        <div className={cn(
                            "rounded-xl p-3",
                            !displayWarranty ? "bg-muted/40"
                            : warrantyDays !== null && warrantyDays < 0 ? "bg-rose-500/10"
                            : warrantyDays !== null && warrantyDays <= 30 ? "bg-amber-500/10"
                            : "bg-emerald-500/10"
                        )}>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                                Garantia até
                            </p>
                            {displayWarranty ? (
                                <>
                                    <p className={cn(
                                        "text-sm font-black",
                                        warrantyDays !== null && warrantyDays < 0 ? "text-rose-600"
                                        : warrantyDays !== null && warrantyDays <= 30 ? "text-amber-600"
                                        : "text-emerald-600"
                                    )}>
                                        {formatDate(displayWarranty)}
                                    </p>
                                    {warrantyDays !== null && (
                                        <p className={cn(
                                            "text-[9px] font-black uppercase tracking-widest mt-0.5",
                                            warrantyDays < 0 ? "text-rose-500"
                                            : warrantyDays <= 30 ? "text-amber-500"
                                            : "text-emerald-500"
                                        )}>
                                            {warrantyDays < 0
                                                ? `Vencida há ${Math.abs(warrantyDays)} dias`
                                                : warrantyDays === 0
                                                ? "Vence hoje!"
                                                : `${warrantyDays} dias restantes`
                                            }
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm font-black text-muted-foreground/40">—</p>
                            )}
                        </div>
                    </div>

                    {/* Edit Form */}
                    {showWarrantyEdit && (
                        <div className="border-t border-border/40 pt-4 space-y-3 animate-in">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest">
                                        Data de Instalação
                                    </Label>
                                    <Input
                                        type="date"
                                        value={installationDate}
                                        onChange={e => setInstallationDate(e.target.value)}
                                        className="font-bold text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest">
                                        Garantia até
                                    </Label>
                                    <Input
                                        type="date"
                                        value={warrantyExpiry}
                                        onChange={e => setWarrantyExpiry(e.target.value)}
                                        className="font-bold text-sm"
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={saveWarranty}
                                disabled={saving}
                                className="w-full rounded-xl font-black uppercase tracking-widest text-xs"
                            >
                                {saving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                                Salvar Garantia
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* === BANCADA EXTERNA === */}
            <Card className={cn(
                "rounded-2xl shadow-sm",
                displayInBancada ? "border-amber-500/40 bg-amber-500/5" : "border-border/60"
            )}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Factory className={cn("h-4 w-4", displayInBancada ? "text-amber-500" : "text-primary")} />
                            {displayInBancada ? "Em Bancada Externa" : "Bancada Externa"}
                        </CardTitle>
                        {displayInBancada && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-amber-500/20 text-amber-700 border border-amber-500/30">
                                Em Manutenção
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {displayInBancada ? (
                        /* Showing bancada info */
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-amber-500/10 rounded-xl p-3">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-600/60 mb-1">Empresa</p>
                                    <p className="text-sm font-black text-amber-700">{displayExtCompany || "—"}</p>
                                </div>
                                <div className="bg-amber-500/10 rounded-xl p-3">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-600/60 mb-1">Saída</p>
                                    <p className="text-sm font-black text-amber-700">{formatDate(displayExtSince) || "—"}</p>
                                </div>
                            </div>

                            {displayExpReturn && (
                                <div className={cn(
                                    "rounded-xl p-3",
                                    returnDays !== null && returnDays < 0 ? "bg-rose-500/10"
                                    : returnDays !== null && returnDays <= 3 ? "bg-amber-500/20"
                                    : "bg-muted/40"
                                )}>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                                        Previsão de Retorno
                                    </p>
                                    <p className={cn(
                                        "text-sm font-black",
                                        returnDays !== null && returnDays < 0 ? "text-rose-600"
                                        : returnDays !== null && returnDays <= 3 ? "text-amber-600"
                                        : "text-foreground"
                                    )}>
                                        {formatDate(displayExpReturn)}
                                        {returnDays !== null && (
                                            <span className="ml-2 text-[10px]">
                                                ({returnDays < 0
                                                    ? `atrasado ${Math.abs(returnDays)}d`
                                                    : returnDays === 0 ? "hoje!"
                                                    : `em ${returnDays}d`})
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}

                            {displayExtNotes && (
                                <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">{displayExtNotes}</p>
                            )}

                            {canEdit && (
                                <Button
                                    variant="outline"
                                    onClick={() => saveBancada(false)}
                                    disabled={saving}
                                    className="w-full rounded-xl font-black uppercase tracking-widest text-xs border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10"
                                >
                                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle2 className="h-3 w-3 mr-2" />}
                                    Equipamento Retornou
                                </Button>
                            )}
                        </div>
                    ) : (
                        /* Not in bancada */
                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-widest text-center py-2">
                                Equipamento em operação normal
                            </p>
                            {canEdit && (
                                <Button
                                    variant="outline"
                                    onClick={() => setShowBancadaEdit(!showBancadaEdit)}
                                    className="w-full rounded-xl font-black uppercase tracking-widest text-xs border-amber-500/40 text-amber-700 hover:bg-amber-500/10"
                                >
                                    <Factory className="h-3 w-3 mr-2" />
                                    Enviar para Bancada
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Edit form for sending to bancada */}
                    {showBancadaEdit && !displayInBancada && canEdit && (
                        <div className="border-t border-border/40 pt-4 space-y-3 animate-in">
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase tracking-widest">Empresa / Prestadora *</Label>
                                <Input
                                    placeholder="Ex: TechFrio Refrigeração Ltda"
                                    value={extCompany}
                                    onChange={e => setExtCompany(e.target.value)}
                                    className="font-bold text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest">Data de Saída</Label>
                                    <Input
                                        type="date"
                                        value={extSince}
                                        onChange={e => setExtSince(e.target.value)}
                                        className="font-bold text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest">Previsão Retorno</Label>
                                    <Input
                                        type="date"
                                        value={expectedReturn}
                                        onChange={e => setExpectedReturn(e.target.value)}
                                        className="font-bold text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase tracking-widest">Observações</Label>
                                <Textarea
                                    placeholder="Motivo, número da OS, etc..."
                                    value={extNotes}
                                    onChange={e => setExtNotes(e.target.value)}
                                    className="font-bold text-sm min-h-[60px]"
                                />
                            </div>
                            <Button
                                onClick={() => saveBancada(true)}
                                disabled={saving || !extCompany}
                                className="w-full rounded-xl font-black uppercase tracking-widest text-xs bg-amber-500 hover:bg-amber-600 text-white"
                            >
                                {saving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Factory className="h-3 w-3 mr-2" />}
                                Confirmar Envio para Bancada
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
