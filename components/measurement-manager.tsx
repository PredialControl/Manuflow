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
    Camera,
    Check,
    Loader2,
    Calendar,
    TrendingUp,
    X,
    ScanLine,
    Image as ImageIcon,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { createWorker } from "tesseract.js";

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

    // Photo capture and OCR states
    const [capturedImage, setCapturedImage] = useState<string>("");
    const [isProcessingOCR, setIsProcessingOCR] = useState(false);
    const [ocrDetectedText, setOcrDetectedText] = useState<string>("");
    const [detectedNumbers, setDetectedNumbers] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Handle photo capture and OCR
    const handlePhotoCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log("[OCR] 📸 Photo captured, starting OCR...");

        // Create preview URL
        const imageUrl = URL.createObjectURL(file);
        setCapturedImage(imageUrl);
        setIsProcessingOCR(true);

        try {
            // Initialize Tesseract worker with optimized config for digits
            const worker = await createWorker("eng", 1, {
                logger: (m) => {
                    if (m.status === "recognizing text") {
                        console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
                    }
                },
            });

            // Configure for better digit recognition
            await worker.setParameters({
                tessedit_char_whitelist: '0123456789.,', // Only digits and decimal separators
            });

            // Perform OCR
            const { data } = await worker.recognize(file);
            await worker.terminate();

            console.log("[OCR] Raw text:", data.text);
            console.log("[OCR] Confidence:", data.confidence);

            // Store detected text for user reference
            setOcrDetectedText(data.text.trim());

            // Clean and extract numbers
            // Remove spaces and special characters, keep only digits and decimal separators
            const cleanedText = data.text.replace(/[^0-9.,]/g, '');
            console.log("[OCR] Cleaned text:", cleanedText);

            // Extract all numbers from the image
            const numberPattern = /\d+[.,]?\d*/g;
            const matches = cleanedText.match(numberPattern);

            if (matches && matches.length > 0) {
                // Normalize and filter numbers
                const normalizedNumbers = matches
                    .map(n => n.replace(',', '.'))
                    .filter(n => n.length >= 3) // Filter out very small numbers (< 3 digits)
                    .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

                // Sort by length (longest first = likely the meter reading)
                normalizedNumbers.sort((a, b) => b.length - a.length);

                console.log("[OCR] ✅ Detected numbers:", normalizedNumbers);
                console.log("[OCR] All raw matches:", matches);
                console.log("[OCR] Confidence:", Math.round(data.confidence), "%");

                setDetectedNumbers(normalizedNumbers);

                // Auto-select the longest number
                if (normalizedNumbers.length > 0) {
                    setNewEntry(prev => ({ ...prev, value: normalizedNumbers[0] }));
                }

                toast({
                    title: `${normalizedNumbers.length} número(s) detectado(s)!`,
                    description: normalizedNumbers.length > 1
                        ? "Selecione o número correto abaixo"
                        : `Leitura: ${normalizedNumbers[0]}`,
                    variant: "success",
                });
            } else {
                console.log("[OCR] ⚠️ No numbers found in cleaned text");
                console.log("[OCR] Original text was:", data.text);
                setDetectedNumbers([]);
                toast({
                    title: "Nenhum número detectado",
                    description: "Verifique a foto e digite manualmente",
                    variant: "default",
                });
            }

        } catch (err) {
            console.error("[OCR] ❌ Error:", err);
            toast({
                title: "Erro no OCR",
                description: "Digite o valor manualmente",
                variant: "destructive",
            });
        } finally {
            setIsProcessingOCR(false);
        }
    }, [toast]);

    // Clean up on dialog close
    useEffect(() => {
        if (!isAddEntryOpen) {
            setCapturedImage("");
            setOcrDetectedText("");
            setDetectedNumbers([]);
            setNewEntry({ value: "", notes: "", photo: "" });
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
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

    const handleAddEntry = async () => {
        if (!selectedDevice || !newEntry.value) {
            return toast({ title: "Erro", description: "Valor eh obrigatorio", variant: "destructive" });
        }

        const currentValue = parseFloat(newEntry.value);
        const lastEntry = selectedDevice.entries?.[0];

        // Validar: novo valor deve ser >= anterior (medidor não volta)
        if (lastEntry && currentValue < lastEntry.value) {
            return toast({
                title: "Valor Invalido",
                description: `O valor deve ser maior ou igual a ultima leitura (${lastEntry.value} ${selectedDevice.unit})`,
                variant: "destructive",
            });
        }

        setLoading(true);
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
                                        Capturar Medicao
                                        <Camera className="h-3.5 w-3.5 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Modal de Captura de Medicao - Camera ao Vivo */}
            <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[2rem] max-h-[90vh] overflow-y-auto">
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
                    <div className="grid gap-5 py-4">
                        {/* Area da Foto com OCR */}
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                                <Camera className="h-3.5 w-3.5" />
                                Foto do Medidor (OCR Automático)
                            </Label>

                            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-border/30 bg-black">
                                {/* Photo Preview */}
                                {capturedImage ? (
                                    <>
                                        <img
                                            src={capturedImage}
                                            alt="Captured meter"
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Processing overlay */}
                                        {isProcessingOCR && (
                                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                                <div className="text-center">
                                                    <p className="text-sm font-black text-white mb-1">
                                                        Lendo números...
                                                    </p>
                                                    <p className="text-[10px] text-white/60">
                                                        Processando OCR
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {/* Focus guide overlay */}
                                        {!isProcessingOCR && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-[70%] h-[30%] border-2 border-primary/60 rounded-xl relative">
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary/90 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                                                        <ScanLine className="h-3 w-3" />
                                                        Área de leitura
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-muted/30 to-muted/10">
                                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                                            <ImageIcon className="h-10 w-10 text-primary/40" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black text-foreground/80 mb-1">
                                                OCR Automático
                                            </p>
                                            <p className="text-[10px] text-muted-foreground/60 max-w-[200px]">
                                                Tire uma foto e os números serão detectados automaticamente
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Photo capture controls */}
                            <div className="flex gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handlePhotoCapture}
                                    disabled={isProcessingOCR}
                                />
                                {!capturedImage ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 rounded-xl h-12 font-black text-[10px] uppercase tracking-widest border-primary/30 text-primary hover:bg-primary hover:text-white"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isProcessingOCR}
                                    >
                                        <Camera className="h-4 w-4 mr-2" />
                                        Tirar Foto
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 rounded-xl h-12 px-4 font-black text-[10px] uppercase tracking-widest"
                                            onClick={() => {
                                                setCapturedImage("");
                                                setOcrDetectedText("");
                                                setDetectedNumbers([]);
                                                setNewEntry(prev => ({ ...prev, value: "" }));
                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                            }}
                                            disabled={isProcessingOCR}
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Nova Foto
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Detected numbers selection */}
                            {detectedNumbers.length > 0 && !isProcessingOCR && (
                                <div className="p-4 bg-primary/5 rounded-xl border-2 border-primary/20">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                                        <ScanLine className="h-3.5 w-3.5" />
                                        {detectedNumbers.length === 1
                                            ? "Número Detectado:"
                                            : `${detectedNumbers.length} Números Detectados - Escolha o correto:`
                                        }
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {detectedNumbers.map((num, idx) => (
                                            <Button
                                                key={idx}
                                                type="button"
                                                variant={newEntry.value === num ? "default" : "outline"}
                                                size="sm"
                                                className={cn(
                                                    "rounded-xl font-black text-lg px-4 h-12 transition-all",
                                                    newEntry.value === num
                                                        ? "bg-primary text-white shadow-lg scale-105"
                                                        : "border-primary/30 hover:border-primary hover:bg-primary/10"
                                                )}
                                                onClick={() => {
                                                    setNewEntry(prev => ({ ...prev, value: num }));
                                                    toast({
                                                        title: "Número selecionado",
                                                        description: `Leitura: ${num}`,
                                                    });
                                                }}
                                            >
                                                {num}
                                                {idx === 0 && detectedNumbers.length > 1 && (
                                                    <span className="ml-2 text-[8px] opacity-70">(maior)</span>
                                                )}
                                            </Button>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-muted-foreground/60 mt-3 italic">
                                        💡 Dica: O número da leitura geralmente é o maior. Se nenhum estiver correto, digite manualmente abaixo.
                                    </p>
                                </div>
                            )}

                            {/* OCR detected text (for debugging) */}
                            {ocrDetectedText && !isProcessingOCR && detectedNumbers.length === 0 && (
                                <div className="p-3 bg-muted/30 rounded-xl border border-border/40">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
                                        Texto Detectado pelo OCR:
                                    </p>
                                    <p className="text-xs font-mono text-muted-foreground break-all">
                                        "{ocrDetectedText}"
                                    </p>
                                    <p className="text-[9px] text-muted-foreground/60 mt-1 italic">
                                        Nenhum número válido encontrado. Digite manualmente abaixo.
                                    </p>
                                </div>
                            )}
                        </div>


                        <div className="space-y-2">
                            <Label htmlFor="value" className="text-xs font-black uppercase tracking-widest opacity-60">
                                Valor Atual do Visor ({selectedDevice?.unit})
                            </Label>
                            <div className="relative">
                                <Input
                                    id="value"
                                    type="number"
                                    step="0.01"
                                    placeholder={selectedDevice?.entries?.[0] ? `> ${selectedDevice.entries[0].value}` : "Digite o valor do visor"}
                                    className="rounded-2xl border-border/50 text-2xl font-black h-14"
                                    value={newEntry.value}
                                    onChange={e => setNewEntry({ ...newEntry, value: e.target.value })}
                                />
                            </div>
                            {selectedDevice?.entries?.[0] && newEntry.value && parseFloat(newEntry.value) >= selectedDevice.entries[0].value && (
                                <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <p className="text-xs font-bold text-green-600">
                                        Consumo: {(parseFloat(newEntry.value) - selectedDevice.entries[0].value).toFixed(2)} {selectedDevice.unit}
                                    </p>
                                </div>
                            )}
                            {selectedDevice?.entries?.[0] && newEntry.value && parseFloat(newEntry.value) < selectedDevice.entries[0].value && (
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
                            onClick={handleAddEntry}
                            disabled={loading || !newEntry.value}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            Salvar Medicao
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
