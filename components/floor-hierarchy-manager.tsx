"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Plus,
    Layers,
    MapPin,
    Loader2,
    Check,
    CheckCircle2,
    AlertTriangle,
    XCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Floor = {
    id: string;
    number: number;
    name?: string;
    locations: Location[];
};

type Location = {
    id: string;
    name: string;
    description?: string;
    assets: Asset[];
};

type Asset = {
    id: string;
    name: string;
    type: string;
    operationalStatus: string;
};

interface FloorHierarchyManagerProps {
    contractId: string;
    floors: Floor[];
    isAdmin?: boolean;
}

export function FloorHierarchyManager({
    contractId,
    floors: initialFloors,
    isAdmin,
}: FloorHierarchyManagerProps) {
    const { toast } = useToast();
    const [floors, setFloors] = useState<Floor[]>(initialFloors);
    const [loading, setLoading] = useState(false);

    // Estados para dialogs
    const [floorDialogOpen, setFloorDialogOpen] = useState(false);
    const [locationDialogOpen, setLocationDialogOpen] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);

    // Estados para formulários
    const [floorForm, setFloorForm] = useState({ fromFloor: "", toFloor: "" });
    const [locationForm, setLocationForm] = useState({ name: "", description: "" });

    // Criar andares em range
    const handleCreateFloors = async () => {
        if (!floorForm.fromFloor || !floorForm.toFloor) {
            return toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
        }

        setLoading(true);
        try {
            const from = parseInt(floorForm.fromFloor);
            const to = parseInt(floorForm.toFloor);

            const res = await fetch(`/api/contracts/${contractId}/floors/batch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fromFloor: from, toFloor: to }),
            });

            if (!res.ok) throw new Error("Erro ao criar andares");

            // Buscar andares atualizados
            const updated = await fetch(`/api/contracts/${contractId}/structure`).then(r => r.json());
            setFloors(updated.floors || []);

            toast({ title: "Sucesso", description: "Andares criados com sucesso" });
            setFloorDialogOpen(false);
            setFloorForm({ fromFloor: "", toFloor: "" });
        } catch (error) {
            toast({ title: "Erro", description: "Erro ao criar andares", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Criar local
    const handleCreateLocation = async () => {
        if (!locationForm.name || !selectedFloor) {
            return toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/floors/${selectedFloor.id}/locations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(locationForm),
            });

            if (!res.ok) throw new Error("Erro ao criar local");

            // Buscar andares atualizados
            const updated = await fetch(`/api/contracts/${contractId}/structure`).then(r => r.json());
            setFloors(updated.floors || []);

            toast({ title: "Sucesso", description: "Local criado com sucesso" });
            setLocationDialogOpen(false);
            setLocationForm({ name: "", description: "" });
        } catch (error) {
            toast({ title: "Erro", description: "Erro ao criar local", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        if (status === "OPERATIONAL") return <CheckCircle2 className="h-3 w-3 text-emerald-600" />;
        if (status === "MAINTENANCE") return <AlertTriangle className="h-3 w-3 text-amber-600" />;
        return <XCircle className="h-3 w-3 text-red-600" />;
    };

    return (
        <div className="space-y-6">
            {/* Header com botão de adicionar andares */}
            {isAdmin && (
                <div className="flex justify-end">
                    <Dialog open={floorDialogOpen} onOpenChange={setFloorDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="btn-premium">
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Andares
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tighter">Adicionar Andares</DialogTitle>
                                <DialogDescription>
                                    Defina o intervalo de andares a serem criados (ex: do 3º ao 24º andar)
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="from-floor">De (andar) *</Label>
                                        <Input
                                            id="from-floor"
                                            type="number"
                                            placeholder="3"
                                            value={floorForm.fromFloor}
                                            onChange={(e) => setFloorForm({ ...floorForm, fromFloor: e.target.value })}
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="to-floor">Até (andar) *</Label>
                                        <Input
                                            id="to-floor"
                                            type="number"
                                            placeholder="24"
                                            value={floorForm.toFloor}
                                            onChange={(e) => setFloorForm({ ...floorForm, toFloor: e.target.value })}
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Todos os andares entre os valores informados serão criados automaticamente
                                </p>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateFloors} disabled={loading} className="btn-premium w-full">
                                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                    Criar Andares
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {/* Lista de andares */}
            {floors.length === 0 ? (
                <Card className="card-premium border-2 border-dashed">
                    <CardContent className="py-20 text-center">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Layers className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-lg font-bold text-muted-foreground">Nenhum andar cadastrado</h3>
                        <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto mt-1">
                            Comece criando andares para organizar os locais
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Accordion type="multiple" className="space-y-4">
                    {floors.map((floor) => (
                        <AccordionItem
                            key={floor.id}
                            value={floor.id}
                            className="border-none"
                        >
                            <Card className="card-premium overflow-hidden">
                                <AccordionTrigger className="hover:no-underline px-6 py-4">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <Layers className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="text-lg font-black tracking-tight">
                                                {floor.number}º Andar {floor.name && `- ${floor.name}`}
                                            </h3>
                                            <p className="text-xs text-muted-foreground font-bold">
                                                {floor.locations.length} locais
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="px-6 pb-4 space-y-4">
                                        {/* Botão adicionar local */}
                                        {isAdmin && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedFloor(floor);
                                                    setLocationDialogOpen(true);
                                                }}
                                                className="w-full rounded-xl"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Adicionar Local
                                            </Button>
                                        )}

                                        {/* Lista de locais */}
                                        {floor.locations.length > 0 ? (
                                            <div className="space-y-2">
                                                {floor.locations.map((location) => (
                                                    <div
                                                        key={location.id}
                                                        className="p-3 bg-background rounded-xl border border-border/40"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <MapPin className="h-4 w-4 text-primary mt-0.5" />
                                                            <div className="flex-1">
                                                                <h4 className="text-sm font-bold">{location.name}</h4>
                                                                {location.description && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {location.description}
                                                                    </p>
                                                                )}
                                                                {location.assets.length > 0 && (
                                                                    <div className="mt-2 space-y-1">
                                                                        {location.assets.map((asset) => (
                                                                            <div
                                                                                key={asset.id}
                                                                                className="flex items-center gap-2 text-xs"
                                                                            >
                                                                                {getStatusIcon(asset.operationalStatus)}
                                                                                <span className="text-muted-foreground">
                                                                                    {asset.name}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {location.assets.length === 0 && (
                                                                    <p className="text-xs text-muted-foreground/50 italic mt-1">
                                                                        Nenhum ativo vinculado
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-center text-muted-foreground/60 py-4">
                                                Nenhum local cadastrado
                                            </p>
                                        )}
                                    </div>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}

            {/* Dialog para criar local */}
            <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tighter">Novo Local</DialogTitle>
                        <DialogDescription>
                            Criar um novo local no {selectedFloor?.number}º andar
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="location-name">Nome do Local *</Label>
                            <Input
                                id="location-name"
                                placeholder="Ex: Sala 301, Copa, Recepção"
                                value={locationForm.name}
                                onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location-desc">Descrição (opcional)</Label>
                            <Input
                                id="location-desc"
                                placeholder="Informações adicionais"
                                value={locationForm.description}
                                onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateLocation} disabled={loading} className="btn-premium w-full">
                            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                            Criar Local
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
