"use client";

import { useState, useEffect } from "react";
import { X, Download, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PwaInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already installed or dismissed
        if (window.matchMedia('(display-mode: standalone)').matches || localStorage.getItem('pwa-prompt-dismissed')) {
            return;
        }

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        // Handler for Android/Chrome
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Show prompt for iOS after a small delay
        if (ios) {
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 z-[100] animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-card/80 backdrop-blur-2xl border border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[2rem] p-6 max-w-md mx-auto relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />

                <button
                    onClick={() => {
                        setShowPrompt(false);
                        localStorage.setItem('pwa-prompt-dismissed', 'true');
                    }}
                    className="absolute top-4 right-4 p-2 text-muted-foreground/40 hover:text-foreground transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="flex gap-4 items-start relative">
                    <div className="h-14 w-14 bg-primary shadow-xl shadow-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-2xl font-black italic">M</span>
                    </div>

                    <div className="flex-1 pr-6">
                        <h3 className="text-lg font-black uppercase italic tracking-tight leading-none mb-1">Instalar ManuFlow</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                            {isIOS
                                ? "Toque em compartilhar e 'Adicionar à Tela de Início' para uma melhor experiência."
                                : "Instale nosso aplicativo para ter acesso rápido e notificações em tempo real."
                            }
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                    {isIOS ? (
                        <div className="flex items-center gap-4 w-full bg-primary/5 rounded-2xl p-3 border border-primary/10">
                            <div className="flex flex-col items-center gap-1 opacity-60">
                                <Share className="h-5 w-5 text-primary" />
                                <span className="text-[8px] font-black uppercase tracking-tighter">Compartilhar</span>
                            </div>
                            <div className="h-8 w-px bg-primary/20" />
                            <div className="flex flex-col items-center gap-1">
                                <PlusSquare className="h-5 w-5 text-primary" />
                                <span className="text-[8px] font-black uppercase tracking-tighter">Add Tela de Início</span>
                            </div>
                        </div>
                    ) : (
                        <Button
                            onClick={handleInstallClick}
                            className="w-full h-12 rounded-2xl btn-premium text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Instalar Agora
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
