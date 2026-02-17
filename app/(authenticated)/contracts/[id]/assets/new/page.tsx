"use client";

import { useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Building2, Upload, X, Camera, Plus, Package, MapPin, Zap } from "lucide-react";
import Link from "next/link";

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

export default function NewAssetPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [checklistItems, setChecklistItems] = useState<string[]>([""]);
  const [checklistEnabled, setChecklistEnabled] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const checklist = checklistEnabled
      ? checklistItems.filter(item => item.trim() !== "")
      : [];

    try {
      const response = await fetch(`/api/contracts/${contractId}/assets`, {
        method: "POST",
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
          checklist: checklist.length > 0 ? checklist : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar ativo");
      }

      toast({
        title: "Sucesso",
        description: "Ativo criado com sucesso",
      });

      router.push(`/contracts/${contractId}?tab=assets`);
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

  function addChecklistItem() {
    setChecklistItems([...checklistItems, ""]);
  }

  function removeChecklistItem(index: number) {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  }

  function updateChecklistItem(index: number, value: string) {
    const newItems = [...checklistItems];
    newItems[index] = value;
    setChecklistItems(newItems);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic leading-none">Novo Ativo</h1>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2 px-1">
          Identificação Técnica do Equipamento
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-4 space-y-6">
          <Card className="border-border/60 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Foto de Identificação</CardTitle>
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
                  A foto ajuda o técnico a identificar o equipamento rapidamente durante a ronda.
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
              <CardTitle className="text-xl font-black tracking-tight italic uppercase">Especificações Técnicas</CardTitle>
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
                    placeholder="Ex: Piso G2 - Sala 04"
                    className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 transition-all font-bold tracking-tight"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Especialidade Requerida</Label>
                  <select
                    id="category"
                    name="category"
                    defaultValue="GERAL"
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
                  <Label htmlFor="frequency" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Frequência de Inspeção</Label>
                  <select
                    id="frequency"
                    name="frequency"
                    defaultValue="MONTHLY"
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

              <div className="pt-4">
                <div
                  className={`border-2 border-dashed rounded-[1.5rem] p-6 transition-all cursor-pointer flex items-center gap-4 ${checklistEnabled ? 'border-primary/40 bg-primary/5' : 'border-border/40 hover:border-primary/20'}`}
                  onClick={() => setChecklistEnabled(!checklistEnabled)}
                >
                  <div className={`h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all ${checklistEnabled ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                    {checklistEnabled && <Plus className="h-4 w-4 text-white" />}
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight italic">Checklist Personalizado</p>
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Adicionar perguntas específicas para este ativo</p>
                  </div>
                </div>
              </div>

              {checklistEnabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary italic">Pontos de Verificação</Label>
                  </div>

                  <div className="space-y-3">
                    {checklistItems.map((item, index) => (
                      <div key={index} className="flex gap-3 animate-in fade-in slide-in-from-right-2">
                        <Input
                          value={item}
                          onChange={(e) => updateChecklistItem(index, e.target.value)}
                          placeholder={`Item de inspeção #${index + 1}`}
                          className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 transition-all font-bold"
                        />
                        {checklistItems.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-12 w-12 rounded-xl flex-shrink-0 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border-none transition-all"
                            onClick={() => removeChecklistItem(index)}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl border-dashed border-2 border-primary/20 text-primary hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest"
                    onClick={addChecklistItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Ponto de Verificação
                  </Button>
                </div>
              )}
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
              {loading ? "Cadastrando Ativo..." : "Confirmar e Salvar Ativo"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
