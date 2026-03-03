"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DebugRondaPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
    console.log(msg);
  };

  async function testAPI() {
    setLogs([]);
    addLog("🔍 Iniciando teste da API...");

    try {
      addLog("📡 Fazendo fetch para /api/ronda/assets");
      const res = await fetch("/api/ronda/assets", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      addLog(`📊 Status: ${res.status} ${res.statusText}`);

      if (res.ok) {
        const data = await res.json();
        addLog(`✅ Sucesso! ${data.length} itens recebidos`);
        setAssets(data);

        data.forEach((item: any, i: number) => {
          addLog(`  ${i + 1}. ${item.name} (${item.itemType})`);
        });
      } else {
        const error = await res.json();
        addLog(`❌ Erro: ${JSON.stringify(error)}`);
      }
    } catch (error: any) {
      addLog(`💥 Exception: ${error.message}`);
      addLog(`Stack: ${error.stack}`);
    }
  }

  async function clearAllCache() {
    addLog("🧹 Limpando cache...");

    if ("caches" in window) {
      const cacheNames = await caches.keys();
      addLog(`📦 Encontrados ${cacheNames.length} caches`);

      for (const name of cacheNames) {
        await caches.delete(name);
        addLog(`🗑️  Deletado: ${name}`);
      }
    }

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      addLog(`🔧 Service Workers: ${registrations.length}`);

      for (const registration of registrations) {
        await registration.unregister();
        addLog(`🗑️  Service Worker desregistrado`);
      }
    }

    addLog("✅ Cache limpo! Recarregue a página.");
  }

  useEffect(() => {
    addLog("🚀 Página de debug carregada");
    addLog(`📱 User Agent: ${navigator.userAgent}`);
    addLog(`🌐 URL: ${window.location.href}`);
  }, []);

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-4">
          🔍 DEBUG RONDA
        </h1>

        <div className="space-y-4 mb-6">
          <Button
            onClick={testAPI}
            className="w-full bg-blue-600 text-white"
          >
            🧪 Testar API /api/ronda/assets
          </Button>

          <Button
            onClick={clearAllCache}
            className="w-full bg-red-600 text-white"
          >
            🧹 Limpar TODO Cache + Service Worker
          </Button>

          <Button
            onClick={() => window.location.href = "/ronda"}
            className="w-full bg-green-600 text-white"
          >
            ➡️ Ir para Ronda Normal
          </Button>
        </div>

        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto max-h-96">
          {logs.length === 0 ? (
            <p className="text-gray-500">Nenhum log ainda...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>

        {assets.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              📦 Dados Recebidos ({assets.length} itens):
            </h2>
            <div className="space-y-2">
              {assets.map((asset, i) => (
                <div
                  key={i}
                  className="bg-gray-100 p-3 rounded border border-gray-300"
                >
                  <p className="font-bold text-gray-900">{asset.name}</p>
                  <p className="text-sm text-gray-600">
                    Tipo: {asset.itemType} | Local: {asset.location}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
