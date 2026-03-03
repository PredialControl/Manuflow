"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, ChevronRight, Loader2 } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
            Carregando...
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Buscando equipamentos e medidores
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="bg-primary text-white p-6 pb-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardCheck className="h-8 w-8" />
            <h1 className="text-3xl font-black uppercase tracking-tight">Ronda Técnica</h1>
          </div>
        </div>
        <div className="p-4">
          <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-bold text-red-600 dark:text-red-400 mb-4">
                {error}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Verifique sua conexão e tente novamente
              </p>
              <Button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetchAssets();
                }}
                className="rounded-xl bg-primary"
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-primary text-white p-6 pb-8 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8" />
            <h1 className="text-3xl font-black uppercase tracking-tight">Ronda Técnica</h1>
          </div>
          <Button
            onClick={() => router.push("/debug-ronda")}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs px-3 py-1 rounded"
          >
            🔍 DEBUG
          </Button>
        </div>
        <p className="text-sm opacity-90 font-bold uppercase tracking-wide">
          Selecione o equipamento para iniciar
        </p>
      </div>

      {/* Asset List */}
      <div className="p-4 space-y-4 pb-24 bg-gray-50 dark:bg-gray-900">
        {assets.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardCheck className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-lg font-bold text-gray-700 dark:text-gray-200">
                Nenhum equipamento disponível
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Contate o administrador para configurar os ativos
              </p>
            </CardContent>
          </Card>
        ) : (
          assets.map((asset) => (
            <Card
              key={asset.id}
              className="border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-all cursor-pointer active:scale-[0.98] shadow-lg bg-white dark:bg-gray-800"
              onClick={() => {
                if (asset.itemType === "DEVICE") {
                  router.push(`/measurements?deviceId=${asset.id}`);
                } else {
                  router.push(`/ronda/${asset.id}`);
                }
              }}
            >
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-5">
                  {/* Asset Image or Icon */}
                  <div className="flex-shrink-0">
                    {asset.image ? (
                      <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-border">
                        <img
                          src={asset.image}
                          alt={asset.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                        <ClipboardCheck className="h-10 w-10 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Asset Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-white truncate">
                      {asset.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wide mt-1">
                      {asset.location}
                    </p>
                    {asset.itemType === "DEVICE" ? (
                      <p className="text-xs text-primary font-black uppercase tracking-widest mt-2">
                        LEITURA • {asset.unit}
                        {asset.serialNumber && ` • ${asset.serialNumber}`}
                      </p>
                    ) : (
                      <p className="text-xs text-primary font-black uppercase tracking-widest mt-2">
                        {asset._count.scripts} {asset._count.scripts === 1 ? 'PERGUNTA' : 'PERGUNTAS'}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-8 w-8 text-primary flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
