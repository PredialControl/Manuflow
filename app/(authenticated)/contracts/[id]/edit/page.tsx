"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Building2, Upload, X, Camera, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EditContractPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [logo, setLogo] = useState<string | null>(null);
    const [contract, setContract] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function fetchContract() {
            try {
                const response = await fetch(`/api/contracts/${params.id}`);
                if (!response.ok) throw new Error("Falha ao carregar contrato");
                const data = await response.json();
                setContract(data);
                setLogo(data.logo);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Não foi possível carregar os dados do contrato",
                });
                router.push("/contracts");
            } finally {
                setFetching(false);
            }
        }
        fetchContract();
    }, [params.id, router]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast({
                    variant: "destructive",
                    title: "Arquivo muito grande",
                    description: "O logo deve ter no máximo 2MB",
                });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);

        try {
            const response = await fetch(`/api/contracts/${params.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    name: formData.get("name"),
                    company: formData.get("company"),
                    responsible: formData.get("responsible"),
                    email: formData.get("email"),
                    phone: formData.get("phone") || undefined,
                    logo: logo,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Erro ao atualizar contrato");
            }

            toast({
                title: "Sucesso",
                description: "Contrato atualizado com sucesso",
            });

            router.push(`/contracts/${params.id}`);
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

    async function onDelete() {
        if (!confirm("Tem certeza que deseja remover este contrato? Esta ação é irreversível.")) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/contracts/${params.id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Erro ao remover contrato");

            toast({
                title: "Sucesso",
                description: "Contrato removido",
            });
            router.push("/contracts");
            router.refresh();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            });
            setLoading(false);
        }
    }

    if (fetching) {
        return <div className="flex items-center justify-center min-h-[400px]">Carregando...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Link href={`/contracts/${params.id}`} className="text-muted-foreground hover:text-primary transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Configurações do Contrato</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic leading-none">Editar Contrato</h1>
                </div>

                <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDelete}
                    disabled={loading}
                    className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-10 px-4"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover Unidade
                </Button>
            </div>

            <form onSubmit={onSubmit} className="grid gap-8 md:grid-cols-12">
                <div className="md:col-span-4 space-y-6">
                    <Card className="border-border/60 shadow-xl overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Logo do Contrato</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-6">
                            <div
                                className="relative group cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="h-40 w-40 rounded-[2.5rem] border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden transition-all group-hover:border-primary/50 group-hover:bg-primary/5 relative">
                                    {logo ? (
                                        <img src={logo} alt="Logo preview" className="absolute inset-0 h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                                            <Camera className="h-10 w-10" />
                                            <span className="text-[10px] font-black uppercase tracking-tighter">Mudar Logo</span>
                                        </div>
                                    )}
                                </div>

                                {logo && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLogo(null);
                                        }}
                                        className="absolute -top-2 -right-2 h-8 w-8 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}

                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2.5rem]">
                                    <Upload className="h-8 w-8 text-white" />
                                </div>
                            </div>

                            <p className="text-[10px] text-center text-muted-foreground font-bold leading-relaxed px-4">
                                Máx: 2MB. Formatos aceitos: PNG, JPG, SVG.
                            </p>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleLogoUpload}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-8 space-y-6">
                    <Card className="border-border/60 shadow-xl overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-6">
                            <CardTitle className="text-lg font-black tracking-tight italic uppercase">Atualizar Informações</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome do Contrato</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={contract?.name}
                                        placeholder="Ex: Condomínio Blue"
                                        className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 transition-all font-bold"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="company" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Razão Social / Empresa</Label>
                                    <Input
                                        id="company"
                                        name="company"
                                        defaultValue={contract?.company}
                                        placeholder="Ex: Administradora XYZ Ltda"
                                        className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 transition-all font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="responsible" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Gestor do Contrato</Label>
                                    <Input
                                        id="responsible"
                                        name="responsible"
                                        defaultValue={contract?.responsible}
                                        placeholder="Nome do responsável"
                                        className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 transition-all font-bold"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email de Contato</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        defaultValue={contract?.email}
                                        placeholder="email@gestor.com"
                                        className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 transition-all font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 max-w-sm">
                                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Telefone / WhatsApp</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    defaultValue={contract?.phone}
                                    placeholder="(11) 99999-9999"
                                    className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border/40 transition-all font-bold"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-4 pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-12 px-10 rounded-xl btn-premium text-xs font-black uppercase tracking-widest flex-1 shadow-2xl shadow-primary/20"
                        >
                            {loading ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
