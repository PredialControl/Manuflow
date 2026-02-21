"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Droplets,
    Zap,
    Flame,
    Plus,
    History,
    Check,
    Loader2,
    Calendar,
    TrendingUp,
    X,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

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

type MeasurementType = "WATER" | "ENERGY" | "GAS";

type Entry = {
    id: string;
    value: number;
    photo?: string;
    date: string | Date;
    user: { name: string };
    notes?: string;
};

type Device = {
    id: string;
    name: string;
    type: MeasurementType;
    unit: string;
    serialNumber?: string;
    entries: Entry[];
};

interface MeasurementManagerProps {
    contractId: string;
    devices: Device[];
    isAdmin?: boolean;
}

export function MeasurementManager({ contractId, devices: initialDevices, isAdmin }: MeasurementManagerProps) {
    const { toast } = useToast();
    const [devices, setDevices] = useState<Device[]>(initialDevices);
    const [loading, setLoading] = useState(false);
    const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
    const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    // Confirmation state
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Form states for new device
    const [newDevice, setNewDevice] = useState({
        name: "",
        type: "WATER" as MeasurementType,
        unit: "m\u00b3",
        serialNumber: ""
    });

    // Form states for new entry
    const [newEntry, setNewEntry] = useState({
        value: "",
        notes: "",
        photo: ""
    });

    const typeIcons = {
        WATER: <Droplets className="h-5 w-5 text-blue-500" />,
        ENERGY: <Zap className="h-5 w-5 text-yellow-500" />,
        GAS: <Flame className="h-5 w-5 text-orange-500" />,
    };

    const typeColors = {
        WATER: "bg-blue-500/10",
        ENERGY: "bg-yellow-500/10",
        GAS: "bg-orange-500/10",
    };

    // Convert formatted value to number (123,45 -> 123.45)
    const valueToNumber = (formattedValue: string): number => {
        if (!formattedValue) return 0;
        // Replace comma with dot for parsing
        const cleaned = formattedValue.replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    };

    // Format water meter value with comma in last 2 digits (ex: 12345 -> 123,45)
    const handleValueChange = (inputValue: string) => {
        // Remove tudo exceto dígitos
        const digitsOnly = inputValue.replace(/\D/g, '');

        if (digitsOnly === '') {
            setNewEntry({ ...newEntry, value: '' });
            return;
        }

        // Para água, formata com vírgula nos 2 últimos dígitos
        if (selectedDevice?.type === 'WATER') {
            if (digitsOnly.length <= 2) {
                // Se tem 2 ou menos dígitos, adiciona 0, antes
                setNewEntry({ ...newEntry, value: `0,${digitsOnly.padStart(2, '0')}` });
            } else {
                // Adiciona vírgula nos 2 últimos dígitos
                const intPart = digitsOnly.slice(0, -2);
                const decPart = digitsOnly.slice(-2);
                setNewEntry({ ...newEntry, value: `${intPart},${decPart}` });
            }
        } else {
            // Para energia e gás, aceita decimal normal
            setNewEntry({ ...newEntry, value: inputValue });
        }
    };

    // Clean up on dialog close
    useEffect(() => {
        if (!isAddEntryOpen) {
            setNewEntry({ value: "", notes: "", photo: "" });
            setShowConfirmation(false);
        }
    }, [isAddEntryOpen]);

    const handleAddDevice = async () => {
        if (!newDevice.name) return toast({ title: "Erro", description: "Nome eh obrigatorio", variant: "destructive" });
        setLoading(true);
        try {
            const res = await fetch(`/api/contracts/${contractId}/measurements/devices`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newDevice)
            });
            if (!res.ok) throw new Error();
            const device = await res.json();
            setDevices([device, ...devices]);
            setIsAddDeviceOpen(false);
            setNewDevice({ name: "", type: "WATER", unit: "m\u00b3", serialNumber: "" });
            toast({ title: "Sucesso", description: "Dispositivo cadastrado!", variant: "success" });
        } catch (error) {
            toast({ title: "Erro", description: "Erro ao cadastrar dispositivo", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Show confirmation before saving
    const handleRequestConfirmation = () => {
        if (!selectedDevice || !newEntry.value) {
            return toast({ title: "Erro", description: "Valor eh obrigatorio", variant: "destructive" });
        }

        const currentValue = valueToNumber(newEntry.value);
        const lastEntry = selectedDevice.entries?.[0];

        // Validar: novo valor deve ser >= anterior (medidor não volta)
        if (lastEntry && currentValue < lastEntry.value) {
            return toast({
                title: "Valor Invalido",
                description: `O valor deve ser maior ou igual a ultima leitura (${lastEntry.value} ${selectedDevice.unit})`,
                variant: "destructive",
            });
        }

        // Show confirmation dialog
        setShowConfirmation(true);
    };

    // Actually save after confirmation
    const handleAddEntry = async () => {
        if (!selectedDevice || !newEntry.value) return;

        const currentValue = valueToNumber(newEntry.value);
        const lastEntry = selectedDevice.entries?.[0];

        setLoading(true);
        setShowConfirmation(false);

        try {
            const res = await fetch(`/api/measurements/devices/${selectedDevice.id}/entries`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    value: currentValue,
                    notes: newEntry.notes,
                })
            });
            if (!res.ok) throw new Error();
            const entry = await res.json();

            // Update local state
            setDevices(devices.map(d =>
                d.id === selectedDevice.id
                    ? { ...d, entries: [entry, ...d.entries].slice(0, 5) }
                    : d
            ));

            const consumption = lastEntry ? currentValue - lastEntry.value : 0;
            const consumptionMsg = consumption > 0 ? ` Consumo: ${consumption.toFixed(2)} ${selectedDevice.unit}` : "";

            setIsAddEntryOpen(false);
            setNewEntry({ value: "", notes: "", photo: "" });
            toast({
                title: "Sucesso!",
                description: `Leitura: ${currentValue} ${selectedDevice.unit}.${consumptionMsg}`,
                variant: "success",
            });
        } catch (error) {
            toast({ title: "Erro", description: "Erro ao registrar leitura", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black tracking-tight uppercase text-muted-foreground/40">Controle de Medicoes</h2>
                    <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                        Agua, Energia e Gas
                    </p>
                </div>
                {isAdmin && (
                    <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="btn-premium">
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Medidor
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tighter">Cadastrar Medidor</DialogTitle>
                                <DialogDescription className="font-medium text-muted-foreground">
                                    Adicione um novo hidrometro ou relogio ao contrato.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest opacity-60">Nome / Identificacao</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ex: Hidrometro Bloco A"
                                        className="rounded-xl border-border/50"
                                        value={newDevice.name}
                                        onChange={e => setNewDevice({ ...newDevice, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest opacity-60">Tipo</Label>
                                        <Select
                                            value={newDevice.type}
                                            onValueChange={(val: MeasurementType) => {
                                                const unit = val === "WATER" ? "m\u00b3" : val === "ENERGY" ? "kWh" : "m\u00b3";
                                                setNewDevice({ ...newDevice, type: val, unit });
                                            }}
                                        >
                                            <SelectTrigger className="rounded-xl border-border/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border/50">
                                                <SelectItem value="WATER">Agua</SelectItem>
                                                <SelectItem value="ENERGY">Energia</SelectItem>
                                                <SelectItem value="GAS">Gas</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="unit" className="text-xs font-black uppercase tracking-widest opacity-60">Unidade</Label>
                                        <Input
                                            id="unit"
                                            className="rounded-xl border-border/50"
                                            value={newDevice.unit}
                                            onChange={e => setNewDevice({ ...newDevice, unit: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="serial" className="text-xs font-black uppercase tracking-widest opacity-60">No de Serie</Label>
                                    <Input
                                        id="serial"
                                        placeholder="Opcional"
                                        className="rounded-xl border-border/50"
                                        value={newDevice.serialNumber}
                                        onChange={e => setNewDevice({ ...newDevice, serialNumber: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    className="w-full btn-premium py-6"
                                    onClick={handleAddDevice}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                    Confirmar Cadastro
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {devices.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-muted/20 border-2 border-dashed border-border/50 rounded-[2rem]">
                        <div className="h-16 w-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <History className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-lg font-bold text-muted-foreground">Nenhum medidor cadastrado</h3>
                        <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto mt-1">
                            Cadastre hidrometros e relogios para comecar a controlar o consumo.
                        </p>
                    </div>
                ) : (
                    devices.map((device) => {
                        const lastEntry = device.entries[0];
                        const prevEntry = device.entries[1];
                        const diff = lastEntry && prevEntry ? lastEntry.value - prevEntry.value : 0;

                        return (
                            <Card key={device.id} className="card-premium overflow-hidden group">
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner", typeColors[device.type])}>
                                        {typeIcons[device.type]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg font-black tracking-tight truncate group-hover:text-primary transition-colors">
                                            {device.name}
                                        </CardTitle>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                            {device.type} {device.serialNumber || "S/N"}
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="bg-muted/30 rounded-2xl p-4 flex items-center justify-between border border-border/40">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Ultima Leitura</p>
                                            <p className="text-2xl font-black tracking-tighter">
                                                {lastEntry ? lastEntry.value : "---"}
                                                <span className="text-xs font-bold text-muted-foreground ml-1">{device.unit}</span>
                                            </p>
                                        </div>
                                        {diff > 0 && (
                                            <div className="bg-amber-500/10 text-amber-600 px-2 py-1 rounded-lg flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" />
                                                <span className="text-[10px] font-black">+{diff.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tabela de historico */}
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 border-b border-border/40 pb-1">Historico de Leituras</p>
                                        {device.entries.length === 0 ? (
                                            <p className="text-xs font-medium text-muted-foreground/50 italic py-2">Sem registros de leitura.</p>
                                        ) : (
                                            <div className="rounded-xl border border-border/40 overflow-hidden">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-muted/30 border-b border-border/30">
                                                            <th className="text-left px-3 py-2 font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Data</th>
                                                            <th className="text-right px-3 py-2 font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Leitura</th>
                                                            <th className="text-right px-3 py-2 font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Consumo</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {device.entries.map((entry, idx) => {
                                                            const prevEntry = device.entries[idx + 1];
                                                            const consumption = prevEntry ? entry.value - prevEntry.value : null;

                                                            return (
                                                                <tr key={entry.id} className={cn("border-b border-border/20 last:border-0", idx % 2 === 0 ? "bg-background" : "bg-muted/10")}>
                                                                    <td className="px-3 py-2">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Calendar className="h-3 w-3 opacity-40" />
                                                                            <span className="font-bold text-muted-foreground/80">{formatDate(entry.date)}</span>
                                                                        </div>
                                                                        <span className="text-[10px] text-muted-foreground/50 ml-4.5">{entry.user.name}</span>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right">
                                                                        <span className="font-black text-foreground">{entry.value} {device.unit}</span>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right">
                                                                        {consumption !== null ? (
                                                                            <span className={cn(
                                                                                "font-black",
                                                                                consumption > 0 ? "text-amber-600" : "text-muted-foreground"
                                                                            )}>
                                                                                {consumption > 0 ? "+" : ""}{consumption.toFixed(2)} {device.unit}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-muted-foreground/40 text-[10px]">Primeira</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full rounded-xl border-border/60 hover:bg-primary hover:text-white hover:border-primary transition-all font-black text-[10px] uppercase tracking-widest h-10 mt-2"
                                        onClick={() => {
                                            setSelectedDevice(device);
                                            setIsAddEntryOpen(true);
                                        }}
                                    >
                                        Nova Leitura
                                        <Plus className="h-3.5 w-3.5 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Modal de Captura de Medicao - Camera ao Vivo */}
            <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
                <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-[2rem] max-h-[90vh] overflow-y-auto overflow-x-hidden" onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tighter">Registrar Leitura</DialogTitle>
                        <DialogDescription className="font-medium text-muted-foreground">
                            {selectedDevice?.name} - {selectedDevice?.type === "WATER" ? "Água" : selectedDevice?.type === "ENERGY" ? "Energia" : "Gás"}
                        </DialogDescription>
                        {selectedDevice && selectedDevice.entries && selectedDevice.entries.length > 0 && (
                            <div className="mt-3 p-3 bg-muted/30 rounded-xl border border-border/40">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Última Leitura</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-primary">{selectedDevice.entries[0].value}</span>
                                    <span className="text-xs font-bold text-muted-foreground">{selectedDevice.unit}</span>
                                    <span className="text-[10px] text-muted-foreground ml-auto">
                                        {formatDate(selectedDevice.entries[0].date)}
                                    </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground/60 mt-1">
                                    O novo valor deve ser MAIOR que este
                                </p>
                            </div>
                        )}
                    </DialogHeader>
                    <div className="grid gap-5 py-4 max-w-full">
                        <div className="space-y-2">
                            <Label htmlFor="value" className="text-xs font-black uppercase tracking-widest opacity-60">
                                Valor Atual do Visor ({selectedDevice?.unit})
                                {selectedDevice?.type === 'WATER' && (
                                    <span className="text-[10px] text-muted-foreground/60 ml-2 normal-case font-medium">
                                        (vírgula automática nos 2 últimos dígitos)
                                    </span>
                                )}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="value"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder={selectedDevice?.entries?.[0] ? `> ${selectedDevice.entries[0].value}` : selectedDevice?.type === 'WATER' ? "Ex: 123,45" : "Digite o valor"}
                                    className="rounded-2xl border-border/50 text-2xl font-black h-14"
                                    value={newEntry.value}
                                    onChange={e => handleValueChange(e.target.value)}
                                />
                            </div>
                            {selectedDevice?.entries?.[0] && newEntry.value && valueToNumber(newEntry.value) >= selectedDevice.entries[0].value && (
                                <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <p className="text-xs font-bold text-green-600">
                                        Consumo: {(valueToNumber(newEntry.value) - selectedDevice.entries[0].value).toFixed(2)} {selectedDevice.unit}
                                    </p>
                                </div>
                            )}
                            {selectedDevice?.entries?.[0] && newEntry.value && valueToNumber(newEntry.value) < selectedDevice.entries[0].value && (
                                <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                    <X className="h-4 w-4 text-red-600" />
                                    <p className="text-xs font-bold text-red-600">
                                        Valor menor que a última leitura!
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-xs font-black uppercase tracking-widest opacity-60">Observacoes (Opcional)</Label>
                            <Input
                                id="notes"
                                className="rounded-xl border-border/50"
                                value={newEntry.notes}
                                onChange={e => setNewEntry({ ...newEntry, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            className="w-full btn-premium py-6"
                            onClick={handleRequestConfirmation}
                            disabled={loading || !newEntry.value}
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Confirmar Leitura
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tighter">Confirmar Leitura</DialogTitle>
                        <DialogDescription className="font-medium text-muted-foreground">
                            Revise os dados antes de salvar
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="p-4 bg-muted/30 rounded-xl border border-border/40">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">
                                Dispositivo
                            </p>
                            <p className="text-lg font-black">{selectedDevice?.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {selectedDevice?.type === "WATER" ? "Água" : selectedDevice?.type === "ENERGY" ? "Energia" : "Gás"}
                            </p>
                        </div>

                        <div className="p-4 bg-primary/10 rounded-xl border-2 border-primary/30">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-2">
                                Nova Leitura
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-primary">{newEntry.value}</span>
                                <span className="text-lg font-bold text-primary/70">{selectedDevice?.unit}</span>
                            </div>
                        </div>

                        {selectedDevice && selectedDevice.entries && selectedDevice.entries.length > 0 && (
                            <div className="p-4 bg-muted/20 rounded-xl border border-border/30">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">
                                    Consumo do Período
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <TrendingUp className="h-5 w-5 text-amber-600" />
                                    <span className="text-2xl font-black text-amber-600">
                                        +{(valueToNumber(newEntry.value) - selectedDevice.entries[0].value).toFixed(2)}
                                    </span>
                                    <span className="text-sm font-bold text-muted-foreground">{selectedDevice.unit}</span>
                                </div>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                    Última leitura: {selectedDevice.entries[0].value} {selectedDevice.unit}
                                </p>
                            </div>
                        )}

                        {newEntry.notes && (
                            <div className="p-3 bg-muted/20 rounded-xl border border-border/30">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
                                    Observações
                                </p>
                                <p className="text-sm text-muted-foreground">{newEntry.notes}</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl"
                            onClick={() => setShowConfirmation(false)}
                            disabled={loading}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 btn-premium rounded-xl"
                            onClick={handleAddEntry}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
