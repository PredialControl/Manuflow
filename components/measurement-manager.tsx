"use client";

import React, { useState } from "react";
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
    Camera,
    Check,
    Loader2,
    Calendar,
    User,
    ChevronRight,
    TrendingUp
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

    // Form states for new device
    const [newDevice, setNewDevice] = useState({
        name: "",
        type: "WATER" as MeasurementType,
        unit: "m³",
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

    const handleAddDevice = async () => {
        if (!newDevice.name) return toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });
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
            setNewDevice({ name: "", type: "WATER", unit: "m³", serialNumber: "" });
            toast({ title: "Sucesso", description: "Dispositivo cadastrado!", variant: "success" });
        } catch (error) {
            toast({ title: "Erro", description: "Erro ao cadastrar dispositivo", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleAddEntry = async () => {
        if (!selectedDevice || !newEntry.value) return toast({ title: "Erro", description: "Valor é obrigatório", variant: "destructive" });
        setLoading(true);
        try {
            const res = await fetch(`/api/measurements/devices/${selectedDevice.id}/entries`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    value: parseFloat(newEntry.value),
                    notes: newEntry.notes,
                    photo: newEntry.photo
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

            setIsAddEntryOpen(false);
            setNewEntry({ value: "", notes: "", photo: "" });
            toast({ title: "Sucesso", description: "Leitura registrada com sucesso!", variant: "success" });
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
                    <h2 className="text-xl font-black tracking-tight uppercase text-muted-foreground/40">Controle de Medições</h2>
                    <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                        Água, Energia e Gás
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
                                    Adicione um novo hidrômetro ou relógio ao contrato.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest opacity-60">Nome / Identificação</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ex: Hidrômetro Bloco A"
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
                                                const unit = val === "WATER" ? "m³" : val === "ENERGY" ? "kWh" : "m³";
                                                setNewDevice({ ...newDevice, type: val, unit });
                                            }}
                                        >
                                            <SelectTrigger className="rounded-xl border-border/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border/50">
                                                <SelectItem value="WATER">Água</SelectItem>
                                                <SelectItem value="ENERGY">Energia</SelectItem>
                                                <SelectItem value="GAS">Gás</SelectItem>
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
                                    <Label htmlFor="serial" className="text-xs font-black uppercase tracking-widest opacity-60">Nº de Série</Label>
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
                            Cadastre hidrômetros e relógios para começar a controlar o consumo.
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
                                            {device.type} • {device.serialNumber || "S/N"}
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="bg-muted/30 rounded-2xl p-4 flex items-center justify-between border border-border/40">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Última Leitura</p>
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

                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 border-b border-border/40 pb-1">Histórico Recente</p>
                                        {device.entries.length === 0 ? (
                                            <p className="text-xs font-medium text-muted-foreground/50 italic py-2">Sem registros de leitura.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {device.entries.map((entry) => (
                                                    <div key={entry.id} className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-3 w-3 opacity-40" />
                                                            <span className="font-bold text-muted-foreground/80">{formatDate(entry.date)}</span>
                                                        </div>
                                                        <span className="font-black text-foreground">{entry.value} {device.unit}</span>
                                                    </div>
                                                ))}
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
                                        Capturar Medição
                                        <Camera className="h-3.5 w-3.5 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Modal de Captura de Medição */}
            <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tighter">Registrar Leitura</DialogTitle>
                        <DialogDescription className="font-medium text-muted-foreground">
                            Informe o valor atual para <span className="text-primary font-bold">{selectedDevice?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-4">
                            <div className="h-48 w-full bg-muted/30 rounded-3xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-3 relative overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer">
                                {newEntry.photo ? (
                                    <img src={newEntry.photo} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />
                                ) : (
                                    <>
                                        <Camera className="h-10 w-10 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Tirar Foto do Visor</p>
                                    </>
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setNewEntry({ ...newEntry, photo: reader.result as string });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="value" className="text-xs font-black uppercase tracking-widest opacity-60">Valor Atual ({selectedDevice?.unit})</Label>
                                <Input
                                    id="value"
                                    type="number"
                                    step="0.01"
                                    placeholder="Digite os números do medidor"
                                    className="rounded-2xl border-border/50 text-2xl font-black h-14"
                                    value={newEntry.value}
                                    onChange={e => setNewEntry({ ...newEntry, value: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-xs font-black uppercase tracking-widest opacity-60">Observações (Opcional)</Label>
                                <Input
                                    id="notes"
                                    className="rounded-xl border-border/50"
                                    value={newEntry.notes}
                                    onChange={e => setNewEntry({ ...newEntry, notes: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            className="w-full btn-premium py-6"
                            onClick={handleAddEntry}
                            disabled={loading || !newEntry.value}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            Salvar Medição
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
