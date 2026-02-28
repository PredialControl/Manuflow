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
    Building2,
    Plus,
    Layers,
    MapPin,
    Package,
    ChevronRight,
    Loader2,
    Check,
    Home,
    CheckCircle2,
    AlertTriangle,
    XCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Building = {
    id: string;
    name: string;
    description?: string;
    floors: Floor[];
};

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

interface BuildingHierarchyManagerProps {
    contractId: string;
    buildings: Building[];
    isAdmin?: boolean;
}

export function BuildingHierarchyManager({
    contractId,
    buildings: initialBuildings,
    isAdmin,
}: BuildingHierarchyManagerProps) {
    const { toast } = useToast();
    const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
    const [loading, setLoading] = useState(false);

    // Estados para dialogs
    const [buildingDialogOpen, setBuildingDialogOpen] = useState(false);
    const [floorDialogOpen, setFloorDialogOpen] = useState(false);
    const [locationDialogOpen, setLocationDialogOpen] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);

    // Estados para formulários
    const [buildingForm, setBuildingForm] = useState({ name: "", description: "" });
    const [floorForm, setFloorForm] = useState({ fromFloor: "", toFloor: "" });
    const [locationForm, setLocationForm] = useState({ name: "", description: "" });

    // Criar prédio
    const handleCreateBuilding = async () => {
        if (!buildingForm.name) {
            return toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/contracts/${contractId}/buildings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildingForm),
            });

            if (!res.ok) throw new Error();
            const newBuilding = await res.json();

            setBuildings([...buildings, { ...newBuilding, floors: [] }]);
            setBuildingDialogOpen(false);
            setBuildingForm({ name: "", description: "" });
            toast({ title: "Sucesso!", description: "Prédio criado", variant: "success" });
        } catch (error) {
            toast({ title: "Erro", description: "Erro ao criar prédio", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Criar andares em range
    const handleCreateFloors = async () => {
        if (!selectedBuilding || !floorForm.fromFloor || !floorForm.toFloor) {
            return toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
        }

        const from = parseInt(floorForm.fromFloor);
        const to = parseInt(floorForm.toFloor);

        if (isNaN(from) || isNaN(to) || from > to) {
            return toast({
                title: "Erro",
                description: "Valores inválidos. 'De' deve ser menor ou igual a 'Até'",
                variant: "destructive",
            });
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/buildings/${selectedBuilding.id}/floors/batch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fromFloor: from, toFloor: to }),
            });

            if (!res.ok) throw new Error();
            const newFloors = await res.json();

            setBuildings(buildings.map(b =>
                b.id === selectedBuilding.id
                    ? { ...b, floors: [...b.floors, ...newFloors].sort((a, b) => a.number - b.number) }
                    : b
            ));

            setFloorDialogOpen(false);
            setFloorForm({ fromFloor: "", toFloor: "" });
            toast({
                title: "Sucesso!",
                description: `${newFloors.length} andares criados`,
                variant: "success",
            });
        } catch (error) {
            toast({ title: "Erro", description: "Erro ao criar andares", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Criar local
    const handleCreateLocation = async () => {
        if (!selectedFloor || !locationForm.name) {
            return toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/floors/${selectedFloor.id}/locations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(locationForm),
            });

            if (!res.ok) throw new Error();
            const newLocation = await res.json();

            setBuildings(buildings.map(b => ({
                ...b,
                floors: b.floors.map(f =>
                    f.id === selectedFloor.id
                        ? { ...f, locations: [...f.locations, { ...newLocation, assets: [] }] }
                        : f
                ),
            })));

            setLocationDialogOpen(false);
            setLocationForm({ name: "", description: "" });
            toast({ title: "Sucesso!", description: "Local criado", variant: "success" });
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
            {/* Header com botão de adicionar prédio */}
            {isAdmin && (
                <div className="flex justify-end">
                    <Dialog open={buildingDialogOpen} onOpenChange={setBuildingDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="btn-premium">
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Prédio
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tighter">Novo Prédio</DialogTitle>
                                <DialogDescription>Crie um novo prédio/torre para organizar os andares e locais</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="building-name">Nome do Prédio *</Label>
                                    <Input
                                        id="building-name"
                                        placeholder="Ex: Torre A, Edifício Principal"
                                        value={buildingForm.name}
                                        onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="building-desc">Descrição (opcional)</Label>
                                    <Input
                                        id="building-desc"
                                        placeholder="Informações adicionais"
                                        value={buildingForm.description}
                                        onChange={(e) => setBuildingForm({ ...buildingForm, description: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateBuilding} disabled={loading} className="btn-premium w-full">
                                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                    Criar Prédio
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {/* Lista de prédios */}
            {buildings.length === 0 ? (
                <Card className="card-premium border-2 border-dashed">
                    <CardContent className="py-20 text-center">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-lg font-bold text-muted-foreground">Nenhum prédio cadastrado</h3>
                        <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto mt-1">
                            Comece criando um prédio para organizar andares e locais
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Accordion type="multiple" className="space-y-4">
                    {buildings.map((building) => (
                        <AccordionItem
                            key={building.id}
                            value={building.id}
                            className="border-none"
                        >
                            <Card className="card-premium overflow-hidden">
                                <AccordionTrigger className="hover:no-underline px-6 py-4">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <Building2 className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="text-lg font-black tracking-tight">{building.name}</h3>
                                            <p className="text-xs text-muted-foreground font-bold">
                                                {building.floors.length} andares • {building.floors.reduce((sum, f) => sum + f.locations.length, 0)} locais
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="px-6 pb-4 space-y-4">
                                        {/* Botão adicionar andares */}
                                        {isAdmin && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedBuilding(building);
                                                    setFloorDialogOpen(true);
                                                }}
                                                className="w-full rounded-xl"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Adicionar Andares
                                            </Button>
                                        )}

                                        {/* Lista de andares */}
                                        <div className="space-y-2">
                                            {building.floors.map((floor) => (
                                                <Card key={floor.id} className="bg-muted/30">
                                                    <CardHeader className="pb-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center">
                                                                    <Layers className="h-4 w-4 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <CardTitle className="text-sm font-black">
                                                                        {floor.number}º Andar {floor.name && `- ${floor.name}`}
                                                                    </CardTitle>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {floor.locations.length} locais
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {isAdmin && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedFloor(floor);
                                                                        setLocationDialogOpen(true);
                                                                    }}
                                                                    className="rounded-lg"
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </CardHeader>
                                                    {floor.locations.length > 0 && (
                                                        <CardContent className="pt-0">
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
                                                        </CardContent>
                                                    )}
                                                </Card>
                                            ))}
                                            {building.floors.length === 0 && (
                                                <p className="text-sm text-center text-muted-foreground/60 py-4">
                                                    Nenhum andar cadastrado
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}

            {/* Dialog para criar andares em range */}
            <Dialog open={floorDialogOpen} onOpenChange={setFloorDialogOpen}>
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

            {/* Dialog para criar local */}
            <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tighter">Novo Local</DialogTitle>
                        <DialogDescription>
                            Adicione um local/sala no {selectedFloor?.number}º andar
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
