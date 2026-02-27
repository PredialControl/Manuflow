"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Package, Upload, X, Camera, MapPin, Zap, Loader2 } from "lucide-react";

const frequencies = [
  { value: "DAILY", label: "Diário" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "MONTHLY", label: "Mensal" },
  { value: "QUARTERLY", label: "Trimestral" },
  { value: "SEMIANNUAL", label: "Semestral" },
  { value: "ANNUAL", label: "Anual" },
];

const categories = [
  { value: "AR_CONDICIONADO", label: "Ar Condicionado" },
  { value: "CIVIL", label: "Civil / Predial" },
  { value: "ELETRICA", label: "Elétrica" },
  { value: "HIDRAULICA", label: "Hidráulica" },
  { value: "INCENDIO", label: "Incêndio" },
  { value: "GERAL", label: "Geral" },
];

interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  brand: string | null;
  model: string | null;
  power: string | null;
  category: string;
  frequency: string;
  image: string | null;
}

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;
  const assetId = params.assetId as string;
  const [loading, setLoading] = useState(false);
  const [fetchingAsset, setFetchingAsset] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAsset();
  }, []);

  async function fetchAsset() {
    try {
      const res = await fetch(`/api/assets/${assetId}`);
      if (!res.ok) throw new Error("Erro ao buscar ativo");
      const data = await res.json();
      setAsset(data);
      setImage(data.image);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados do ativo",
      });
      router.back();
    } finally {
      setFetchingAsset(false);
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 2MB",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          type: formData.get("type"),
          location: formData.get("location"),
          brand: formData.get("brand"),
          model: formData.get("model"),
          power: formData.get("power"),
          category: formData.get("category"),
          frequency: formData.get("frequency"),
          image: image,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar ativo");
      }

      toast({
        title: "Sucesso",
        description: "Ativo atualizado com sucesso",
      });

      router.push(`/contracts/${contractId}/assets/${assetId}`);
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  if (fetchingAsset) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Carregando dados do ativo...
          </p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic leading-none">
          Editar Ativo
        </h1>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2 px-1">
          Atualizar Informações do Equipamento
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-4 space-y-6">
          <Card className="border-border/60 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                Foto de Identificação
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <div
                className="relative group cursor-pointer w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="aspect-square w-full rounded-[2.5rem] border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden transition-all group-hover:border-primary/50 group-hover:bg-primary/5 relative">
                  {image ? (
                    <img src={image} alt="Asset preview" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
                      <Camera className="h-12 w-12" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Enviar Foto</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="h-10 w-10 text-white" />
                  </div>
                </div>

                {image && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage(null);
                    }}
                    className="absolute -top-2 -right-2 h-9 w-9 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="bg-primary/5 p-4 rounded-2xl w-full border border-primary/10">
                <p className="text-[10px] text-primary font-bold leading-relaxed flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 flex-shrink-0" />
                  Clique na área acima para alterar a foto do equipamento.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-8 space-y-6">
          <Card className="border-border/60 shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-6 px-8">
              <CardTitle className="text-xl font-black tracking-tight italic uppercase">
                Especificações Técnicas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <Package className="h-3 w-3" /> Nome do Equipamento
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={asset.name}
                    placeholder="Ex: Gerador Stemac 500kVA"
                    className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 transition-all font-bold tracking-tight"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <Zap className="h-3 w-3" /> Categoria / Tipo
                  </Label>
                  <Input
                    id="type"
                    name="type"
                    defaultValue={asset.type}
                    placeholder="Ex: Geradores, Elétrica, Bombas"
                    className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 transition-all font-bold tracking-tight"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    Marca
                  </Label>
                  <Input
                    id="brand"
                    name="brand"
                    defaultValue={asset.brand || ""}
                    placeholder="Ex: Stemac"
                    className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 transition-all font-bold tracking-tight"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    Modelo
                  </Label>
                  <Input
                    id="model"
                    name="model"
                    defaultValue={asset.model || ""}
                    placeholder="Ex: S-500"
                    className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 transition-all font-bold tracking-tight"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="power" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    Potência
                  </Label>
                  <Input
                    id="power"
                    name="power"
                    defaultValue={asset.power || ""}
                    placeholder="Ex: 500kVA"
                    className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 transition-all font-bold tracking-tight"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> Localização Exata
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={asset.location}
                    placeholder="Ex: Piso G2 - Sala 04"
                    className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 transition-all font-bold tracking-tight"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Especialidade Requerida
                  </Label>
                  <select
                    id="category"
                    name="category"
                    defaultValue={asset.category}
                    className="flex h-12 w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm font-bold focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="frequency" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Frequência de Inspeção
                  </Label>
                  <select
                    id="frequency"
                    name="frequency"
                    defaultValue={asset.frequency}
                    className="flex h-12 w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm font-bold focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  >
                    {frequencies.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-10 rounded-xl btn-premium text-xs font-black uppercase tracking-widest flex-1 shadow-2xl shadow-primary/20 active:scale-95 transition-transform"
            >
              {loading ? "Salvando Alterações..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
