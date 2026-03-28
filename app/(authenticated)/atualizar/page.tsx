"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw, CheckCircle2, Loader2 } from "lucide-react";

export default function AtualizarPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"clearing" | "done" | "error">("clearing");
    const [log, setLog] = useState<string[]>([]);

    useEffect(() => {
        async function clearEverything() {
            const msgs: string[] = [];

            try {
                // 1. Limpar todos os caches do service worker
                if ("caches" in window) {
                    const keys = await caches.keys();
                    for (const key of keys) {
                        await caches.delete(key);
                        msgs.push(`✓ Cache "${key}" removido`);
                    }
                    if (keys.length === 0) msgs.push("✓ Nenhum cache encontrado");
                } else {
                    msgs.push("⚠ Cache API não disponível neste browser");
                }

                // 2. Desregistrar service workers antigos
                if ("serviceWorker" in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const reg of registrations) {
                        await reg.unregister();
                        msgs.push(`✓ Service worker desregistrado`);
                    }
                    if (registrations.length === 0) msgs.push("✓ Nenhum service worker ativo");
                }

                setLog(msgs);
                setStatus("done");

                // Recarregar completamente após 2 segundos
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 2000);
            } catch (err) {
                msgs.push(`✗ Erro: ${String(err)}`);
                setLog(msgs);
                setStatus("error");
            }
        }

        clearEverything();
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
            <div className="w-full max-w-sm space-y-6 text-center">
                <div className="flex flex-col items-center gap-4">
                    {status === "clearing" && (
                        <>
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tighter uppercase">Limpando cache...</h1>
                                <p className="text-sm text-muted-foreground font-bold mt-1">Aguarde um momento</p>
                            </div>
                        </>
                    )}

                    {status === "done" && (
                        <>
                            <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tighter uppercase text-emerald-600">Pronto!</h1>
                                <p className="text-sm text-emerald-600/80 font-bold mt-1">Redirecionando para o app...</p>
                            </div>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <div className="h-20 w-20 rounded-full bg-rose-500/10 flex items-center justify-center">
                                <RefreshCcw className="h-10 w-10 text-rose-500" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tighter uppercase text-rose-600">Erro</h1>
                                <p className="text-sm text-rose-600/80 font-bold mt-1">Tente fechar e reabrir o app</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Log */}
                {log.length > 0 && (
                    <div className="bg-muted/50 rounded-2xl p-4 text-left space-y-1">
                        {log.map((msg, i) => (
                            <p key={i} className="text-[10px] font-mono text-muted-foreground">{msg}</p>
                        ))}
                    </div>
                )}

                {status === "error" && (
                    <button
                        onClick={() => window.location.href = "/dashboard"}
                        className="w-full py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-sm"
                    >
                        Ir para o Dashboard
                    </button>
                )}
            </div>
        </div>
    );
}
