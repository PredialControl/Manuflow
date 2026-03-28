"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, ChevronRight, Loader2, RefreshCcw, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  image: string | null;
  itemType: "ASSET" | "DEVICE";
  _count: {
    scripts: number;
  };
  unit?: string;
  serialNumber?: string;
}

export default function RondaPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();

    // Timeout de segurança - se após 10s ainda estiver carregando, força erro
    const timeout = setTimeout(() => {
      if (loading) {
        console.error("[RONDA] TIMEOUT! Forçando fim do loading após 10s");
        setLoading(false);
        setError("Timeout ao carregar dados. Tente novamente.");
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  async function fetchAssets() {
    try {
      console.log("[RONDA] Buscando ativos...");
      const res = await fetch("/api/ronda/assets");
      console.log("[RONDA] Status da resposta:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("[RONDA] Ativos recebidos:", data.length);
        setAssets(data);
        setError(null);
      } else {
        const errorData = await res.json();
        console.error("[RONDA] Erro na API:", errorData);
        setError(errorData.message || "Erro ao buscar ativos");
      }
    } catch (error) {
      console.error("[RONDA] Erro ao buscar ativos:", error);
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      console.log("[RONDA] Loading finalizado");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Carregando equipamentos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-in">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">Ronda Técnica</h1>
        </div>
        <Card className="border-2 border-rose-500/40 bg-rose-500/5 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <p className="text-lg font-black text-rose-600 uppercase tracking-tight">{error}</p>
            <p className="text-sm text-muted-foreground font-bold">Verifique sua conexão e tente novamente</p>
            <Button
              onClick={() => { setError(null); setLoading(true); fetchAssets(); }}
              className="rounded-xl font-black uppercase tracking-widest text-xs"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            Ronda Técnica
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">
            Selecione o equipamento para iniciar
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchAssets}
          className="rounded-xl hover:bg-primary/5 text-primary"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Asset List */}
      <div className="space-y-3">
        {assets.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <ClipboardCheck className="h-8 w-8 text-muted-foreground/20" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Nenhum equipamento vinculado ao seu perfil
            </p>
            <p className="text-xs text-muted-foreground/60">
              Contate o administrador para configurar os ativos
            </p>
          </div>
        ) : (
          assets.map((asset) => (
            <Card
              key={asset.id}
              className="border-border/60 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer active:scale-[0.99] rounded-2xl bg-card"
              onClick={() => {
                if (asset.itemType === "DEVICE") {
                  router.push(`/measurements?deviceId=${asset.id}`);
                } else {
                  router.push(`/ronda/${asset.id}`);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Asset Image or Icon */}
                  <div className="flex-shrink-0">
                    {asset.image ? (
                      <div className="h-16 w-16 rounded-xl overflow-hidden border border-border">
                        <img src={asset.image} alt={asset.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <ClipboardCheck className="h-8 w-8 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Asset Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black uppercase tracking-tighter truncate leading-tight">
                      {asset.name}
                    </h3>
                    {asset.location && (
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 mt-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {asset.location}
                      </p>
                    )}
                    {asset.itemType === "DEVICE" ? (
                      <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1.5">
                        LEITURA • {asset.unit}
                        {asset.serialNumber && ` • SN: ${asset.serialNumber}`}
                      </p>
                    ) : (
                      <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1.5">
                        {asset._count.scripts} {asset._count.scripts === 1 ? 'ponto de verificação' : 'pontos de verificação'}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="h-10 w-10 rounded-xl bg-primary/5 group-hover:bg-primary flex items-center justify-center text-primary flex-shrink-0 transition-all">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
