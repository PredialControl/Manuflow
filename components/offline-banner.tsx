"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getQueue } from "@/hooks/use-offline-queue";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [justReconnected, setJustReconnected] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setPendingCount(getQueue().length);

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 4000);
    };

    const handleSynced = () => {
      setPendingCount(0);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("manuflow:synced", handleSynced);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("manuflow:synced", handleSynced);
    };
  }, []);

  if (isOnline && !justReconnected && pendingCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed top-14 lg:top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300",
        !isOnline
          ? "bg-red-500 text-white"
          : justReconnected
          ? "bg-emerald-500 text-white"
          : "bg-amber-500 text-white"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Offline — ações salvas, serão enviadas ao conectar</span>
        </>
      ) : justReconnected ? (
        <>
          <Wifi className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Conectado! Sincronizando...</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <RefreshCcw className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />
          <span>{pendingCount} ação(ões) pendente(s)</span>
        </>
      ) : null}
    </div>
  );
}
