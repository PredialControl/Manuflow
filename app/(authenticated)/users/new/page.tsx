"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";

const roles = [
    { value: "ADMIN", label: "Administrador" },
    { value: "SUPERVISOR", label: "Supervisor" },
    { value: "TECHNICIAN", label: "Técnico" },
];

const categories = [
    { value: "AR_CONDICIONADO", label: "Ar Condicionado" },
    { value: "CIVIL", label: "Civil / Predial" },
    { value: "ELETRICA", label: "Elétrica" },
    { value: "HIDRAULICA", label: "Hidráulica" },
    { value: "INCENDIO", label: "Incêndio" },
    { value: "GERAL", label: "Geral" },
];

export default function NewUserPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState("TECHNICIAN");

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
            const res = await fetch("/api/users", {
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
                description: "Usuário criado com sucesso",
            });
            router.push("/users");
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
            <div className="flex items-center gap-4">
                <Link href="/users">
                    <Button variant="outline" size="icon" className="rounded-xl">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase italic">Novo Usuário</h1>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Adicionar colaborador ao sistema</p>
                </div>
            </div>

            <Card className="border-border/60 shadow-xl rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/40 p-8">
                    <CardTitle className="text-xl font-bold flex items-center gap-3 text-primary">
                        <UserPlus className="h-6 w-6" />
                        Dados Cadastrais
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
                                    required
                                    className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
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
                                    required
                                    className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nível de Acesso</Label>
                                <select
                                    id="role"
                                    name="role"
                                    className="flex h-12 w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm font-bold focus:bg-background transition-all"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                >
                                    {roles.map((role) => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectedRole === "TECHNICIAN" && (
                            <div className="space-y-2 animate-in slide-in-from-top-2">
                                <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Especialidade / Categoria</Label>
                                <select
                                    id="category"
                                    name="category"
                                    className="flex h-12 w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm font-bold focus:bg-background transition-all"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.value} value={cat.value}>{cat.label.toUpperCase()}</option>
                                    ))}
                                </select>
                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest ml-1">O técnico verá apenas equipamentos desta categoria.</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <UserPlus className="h-5 w-5 mr-3" />}
                            Cadastrar Colaborador
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
