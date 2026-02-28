"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, UserPlus, Users, AlertCircle } from "lucide-react";
import Link from "next/link";

const roles = [
    { value: "ADMIN", label: "Administrador do Contrato" },
    { value: "SUPERVISOR", label: "Supervisor de Área" },
    { value: "TECHNICIAN", label: "Técnico Residente" },
];

const categories = [
    { value: "AR_CONDICIONADO", label: "Ar Condicionado" },
    { value: "CIVIL", label: "Civil / Predial" },
    { value: "ELETRICA", label: "Elétrica" },
    { value: "HIDRAULICA", label: "Hidráulica" },
    { value: "INCENDIO", label: "Incêndio" },
    { value: "GERAL", label: "Geral" },
];

export default function NewContractUserPage() {
    const router = useRouter();
    const params = useParams();
    const contractId = params.id as string;
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState("TECHNICIAN");
    const [technicianCount, setTechnicianCount] = useState(0);
    const [loadingCount, setLoadingCount] = useState(true);

    const userRole = session?.user?.role;
    const isSupervisor = userRole === "SUPERVISOR";
    const isOwnerOrAdmin = userRole === "OWNER" || userRole === "ADMIN";

    // Buscar contagem de técnicos
    useEffect(() => {
        async function fetchTechnicianCount() {
            try {
                const res = await fetch(`/api/contracts/${contractId}/users/count`);
                if (res.ok) {
                    const data = await res.json();
                    setTechnicianCount(data.technicianCount || 0);
                }
            } catch (error) {
                console.error("Error fetching technician count:", error);
            } finally {
                setLoadingCount(false);
            }
        }
        fetchTechnicianCount();
    }, [contractId]);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            password: formData.get("password"),
            role: formData.get("role"),
            category: formData.get("role") === "TECHNICIAN" ? formData.get("category") : null,
        };

        try {
            const res = await fetch(`/api/contracts/${contractId}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Erro ao criar usuário");
            }

            toast({
                title: "Sucesso",
                description: "Colaborador adicionado ao contrato",
            });
            router.push(`/contracts/${contractId}?tab=team`);
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

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/contracts/${contractId}?tab=team`}>
                        <Button variant="outline" size="icon" className="rounded-xl">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Adicionar à Equipe</h1>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Novo acesso para este contrato</p>
                    </div>
                </div>

                {!loadingCount && (
                    <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                        <Users className="h-4 w-4 text-primary" />
                        <div className="text-right">
                            <p className="text-xs font-black text-primary uppercase tracking-widest">
                                Técnicos
                            </p>
                            <p className={`text-lg font-black ${technicianCount >= 4 ? 'text-red-600' : 'text-primary'}`}>
                                {technicianCount}/4
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <Card className="border-border/60 shadow-xl rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/40 p-8">
                    <CardTitle className="text-xl font-bold flex items-center gap-3 text-primary">
                        <UserPlus className="h-6 w-6" />
                        Acesso do Colaborador
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Ex: João Silva"
                                    required
                                    className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail de Acesso</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="joao@empresa.com"
                                    required
                                    className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 font-bold"
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Senha Inicial</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    Nível de Permissão
                                    {isSupervisor && (
                                        <span className="ml-2 text-amber-600">(Apenas Técnicos)</span>
                                    )}
                                </Label>
                                <select
                                    id="role"
                                    name="role"
                                    className="flex h-12 w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm font-bold focus:bg-background transition-all cursor-pointer"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                >
                                    {roles.map((role) => {
                                        // Supervisor só pode criar TECHNICIAN
                                        if (isSupervisor && role.value !== "TECHNICIAN") {
                                            return null;
                                        }
                                        return (
                                            <option key={role.value} value={role.value}>
                                                {role.label}
                                            </option>
                                        );
                                    })}
                                </select>
                                {isSupervisor && (
                                    <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mt-1 ml-1">
                                        * Supervisores podem adicionar apenas técnicos
                                    </p>
                                )}
                            </div>
                        </div>

                        {selectedRole === "TECHNICIAN" && (
                            <>
                                {technicianCount >= 4 && (
                                    <div className="p-4 bg-red-500/10 border-2 border-red-500/20 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-black text-red-600 uppercase tracking-tight">
                                                Limite de Técnicos Atingido
                                            </p>
                                            <p className="text-xs text-red-600/80 font-bold mt-1">
                                                Este contrato já possui 4 técnicos. Não é possível adicionar mais.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Especialidade / Trade</Label>
                                    <select
                                        id="category"
                                        name="category"
                                        className="flex h-12 w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm font-bold focus:bg-background transition-all cursor-pointer"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.value} value={cat.value}>{cat.label.toUpperCase()}</option>
                                        ))}
                                    </select>
                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1 ml-1 opacity-70">
                                        * O técnico verá apenas equipamentos marcados com esta especialidade.
                                    </p>
                                </div>
                            </>
                        )}

                        {selectedRole === "SUPERVISOR" && isOwnerOrAdmin && (
                            <div className="p-4 bg-blue-500/10 border-2 border-blue-500/20 rounded-xl flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-black text-blue-600 uppercase tracking-tight">
                                        Adicionando Supervisor/Coordenador
                                    </p>
                                    <p className="text-xs text-blue-600/80 font-bold mt-1">
                                        Este usuário poderá gerenciar este contrato e adicionar até 4 técnicos.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="pt-4">
                            <Button
                                type="submit"
                                className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] hover:shadow-primary/30"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <UserPlus className="h-5 w-5 mr-3" />}
                                Criar Acesso e Vincular
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
