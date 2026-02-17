"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Pencil,
    Trash2,
    Loader2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

interface ContractUserActionsProps {
    contractId: string;
    userId: string;
    userName: string;
}

export function ContractUserActions({ contractId, userId, userName }: ContractUserActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/contracts/${contractId}/users/${userId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Erro ao remover usuário");
            }

            toast({
                title: "Sucesso",
                description: "Colaborador removido da equipe com sucesso",
            });

            router.refresh();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            });
        } finally {
            setLoading(false);
            setShowDeleteDialog(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Link href={`/contracts/${contractId}/users/${userId}/edit`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <Pencil className="h-4 w-4" />
                </Button>
            </Link>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>

            {showDeleteDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Remover Colaborador?</h3>
                        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                            Tem certeza que deseja remover <span className="text-primary">{userName}</span> desta equipe?
                            Ele poderá ser readicionado posteriormente se necessário.
                        </p>
                        <div className="flex justify-end gap-3 mt-8">
                            <Button
                                variant="ghost"
                                onClick={() => setShowDeleteDialog(false)}
                                className="font-bold uppercase tracking-widest text-xs h-10 px-6 rounded-xl"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={loading}
                                className="font-black uppercase tracking-widest text-xs h-10 px-6 rounded-xl"
                            >
                                {loading ? "Removendo..." : "Sim, Remover"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
