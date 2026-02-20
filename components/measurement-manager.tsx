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
    Focus,
    X,
    ScanLine,
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

    // Camera states
    const [cameraActive, setCameraActive] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrResult, setOcrResult] = useState<string>("");

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

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

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setCameraActive(true);
        } catch (err) {
            toast({
                title: "Erro",
                description: "Nao foi possivel acessar a camera. Verifique as permissoes.",
                variant: "destructive",
            });
        }
    }, [toast]);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    // Capture photo from video stream
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);

        // Get as data URL for preview
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedPhoto(dataUrl);

        stopCamera();
        runOCR(dataUrl);
    }, [stopCamera]);

    // Run OCR on captured image
    const runOCR = async (imageData: string) => {
        setOcrLoading(true);
        setOcrResult("");
        try {
            const { createWorker } = await import("tesseract.js");
            const worker = await createWorker("por");
            const { data } = await worker.recognize(imageData);
            await worker.terminate();

            // Extract only numbers from OCR result
            const numbers = data.text.replace(/[^0-9.,]/g, "").replace(",", ".");
            if (numbers) {
                setOcrResult(numbers);
                setNewEntry((prev) => ({ ...prev, value: numbers }));
                toast({
                    title: "Leitura detectada",
                    description: `Valor encontrado: ${numbers}`,
                    variant: "success",
                });
            } else {
                toast({
                    title: "OCR",
                    description: "Nao foi possivel detectar numeros. Digite manualmente.",
                    variant: "destructive",
                });
            }
        } catch (err) {
            console.error("OCR error:", err);
            toast({
                title: "OCR falhou",
                description: "Erro ao processar imagem. Digite o valor manualmente.",
                variant: "destructive",
            });
        } finally {
            setOcrLoading(false);
        }
    };

    // Clean up camera on dialog close
    useEffect(() => {
        if (!isAddEntryOpen) {
            stopCamera();
            setCapturedPhoto(null);
            setOcrResult("");
            setNewEntry({ value: "", notes: "", photo: "" });
        }
    }, [isAddEntryOpen, stopCamera]);

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
        if (!selectedDevice || !newEntry.value) return toast({ title: "Erro", description: "Valor eh obrigatorio", variant: "destructive" });
        setLoading(true);
        try {
            const res = await fetch(`/api/measurements/devices/${selectedDevice.id}/entries`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    value: parseFloat(newEntry.value),
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

            setIsAddEntryOpen(false);
            setCapturedPhoto(null);
            setOcrResult("");
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
                                                            <th className="text-right px-3 py-2 font-black text-[10px] uppercase tracking-widest text-muted-foreground/50">Valor</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {device.entries.map((entry, idx) => (
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
                                                            </tr>
                                                        ))}
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
                            Tire uma foto do visor do <span className="text-primary font-bold">{selectedDevice?.name}</span> para leitura automatica.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        {/* Area da Camera / Foto */}
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                                <Camera className="h-3.5 w-3.5" />
                                Foto do Medidor
                            </Label>

                            <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border-2 border-border/30">
                                {/* Video Stream */}
                                {cameraActive && (
                                    <>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="absolute inset-0 h-full w-full object-cover"
                                        />
                                        {/* Guia de foco - retangulo nos numeros */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-[70%] h-[30%] border-2 border-primary/80 rounded-xl relative">
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary/90 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                                                    <Focus className="h-3 w-3" />
                                                    Foque nos numeros
                                                </div>
                                                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-md" />
                                                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-md" />
                                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-md" />
                                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-md" />
                                            </div>
                                        </div>
                                        {/* Scan line animation */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-[70%] h-[30%] overflow-hidden">
                                                <div className="w-full h-0.5 bg-primary/60 animate-scan" />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Captured Photo Preview */}
                                {capturedPhoto && !cameraActive && (
                                    <img src={capturedPhoto} alt="Foto do medidor" className="absolute inset-0 h-full w-full object-cover" />
                                )}

                                {/* Placeholder */}
                                {!cameraActive && !capturedPhoto && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/30">
                                        <Camera className="h-12 w-12 text-muted-foreground/30" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                                            Abrir camera para fotografar
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Camera controls */}
                            <div className="flex gap-2">
                                {!cameraActive && !capturedPhoto && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 rounded-xl h-12 font-black text-[10px] uppercase tracking-widest border-primary/30 text-primary hover:bg-primary hover:text-white"
                                        onClick={startCamera}
                                    >
                                        <Camera className="h-4 w-4 mr-2" />
                                        Abrir Camera
                                    </Button>
                                )}
                                {cameraActive && (
                                    <>
                                        <Button
                                            type="button"
                                            className="flex-1 btn-premium h-12 font-black text-[10px] uppercase tracking-widest"
                                            onClick={capturePhoto}
                                        >
                                            <ScanLine className="h-4 w-4 mr-2" />
                                            Capturar
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-xl h-12 px-4"
                                            onClick={stopCamera}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                                {capturedPhoto && !cameraActive && (
                                    <>
                                        <div className="flex-1 flex items-center gap-2 bg-green-500/10 text-green-600 rounded-xl px-4 h-12">
                                            <Check className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Foto capturada</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-xl h-12 px-4 text-[10px] font-black uppercase tracking-widest"
                                            onClick={() => {
                                                setCapturedPhoto(null);
                                                setOcrResult("");
                                                setNewEntry(prev => ({ ...prev, value: "" }));
                                                startCamera();
                                            }}
                                        >
                                            Refazer
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* OCR Status */}
                            {ocrLoading && (
                                <div className="flex items-center gap-2 bg-blue-500/10 text-blue-600 rounded-xl px-4 py-3">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Lendo numeros da foto...</span>
                                </div>
                            )}
                            {ocrResult && !ocrLoading && (
                                <div className="flex items-center gap-2 bg-green-500/10 text-green-600 rounded-xl px-4 py-3">
                                    <ScanLine className="h-4 w-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Valor detectado: {ocrResult}</span>
                                </div>
                            )}
                        </div>

                        {/* Canvas oculto para captura */}
                        <canvas ref={canvasRef} className="hidden" />

                        <div className="space-y-2">
                            <Label htmlFor="value" className="text-xs font-black uppercase tracking-widest opacity-60">Valor Atual ({selectedDevice?.unit})</Label>
                            <Input
                                id="value"
                                type="number"
                                step="0.01"
                                placeholder="Digite ou use a leitura automatica"
                                className="rounded-2xl border-border/50 text-2xl font-black h-14"
                                value={newEntry.value}
                                onChange={e => setNewEntry({ ...newEntry, value: e.target.value })}
                            />
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
