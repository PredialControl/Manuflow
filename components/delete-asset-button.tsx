"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface DeleteAssetButtonProps {
    assetId: string;
    contractId: string;
    assetName: string;
    variant?: "default" | "icon";
}

export function DeleteAssetButton({ assetId, contractId, assetName, variant = "default" }: DeleteAssetButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleDelete(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm(`Tem certeza que deseja apagar o ativo "${assetName}"?`)) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/assets/${assetId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast({
                    title: "Ativo apagado",
                    description: `${assetName} foi removido com sucesso.`,
                });
                router.refresh();
            } else {
                const data = await res.json();
                toast({
                    variant: "destructive",
                    title: "Erro ao apagar",
                    description: data.message || "Não foi possível apagar o ativo.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Ocorreu um erro inesperado.",
            });
        } finally {
            setLoading(false);
        }
    }

    if (variant === "icon") {
        return (
            <button
                onClick={handleDelete}
                disabled={loading}
                className="h-8 w-8 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-lg"
                title="Apagar Ativo"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </button>
        );
    }

    return (
        <Button
            variant="outline"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-xl border-rose-500/30 text-rose-500 hover:bg-rose-500/10 font-bold uppercase tracking-widest text-[10px] h-10"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Apagar Ativo
        </Button>
    );
}
