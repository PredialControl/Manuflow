"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Users, FileText, Package, TrendingUp, Trash2 } from "lucide-react";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  logo: string | null;
  subscriptionStatus: "TRIAL" | "ACTIVE" | "SUSPENDED" | "EXPIRED";
  expirationDate: string | null;
  createdAt: string;
  users: Array<{ id: string; name: string; email: string; role: string; createdAt: string }>;
  contracts: Array<{ id: string; name: string; company: string; active: boolean; createdAt: string }>;
  _count: {
    users: number;
    contracts: number;
    assets: number;
    reports: number;
  };
}

const statusColors = {
  TRIAL: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ACTIVE: "bg-green-500/10 text-green-500 border-green-500/20",
  SUSPENDED: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  EXPIRED: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusLabels = {
  TRIAL: "Trial",
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  EXPIRED: "Expirado",
};

export default function CompanyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    subscriptionStatus: "TRIAL",
    expirationDate: "",
  });

  useEffect(() => {
    fetchCompany();
  }, []);

  async function fetchCompany() {
    try {
      const res = await fetch(`/api/super-admin/companies/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setCompany(data);
        setFormData({
          name: data.name,
          logo: data.logo || "",
          subscriptionStatus: data.subscriptionStatus,
          expirationDate: data.expirationDate
            ? new Date(data.expirationDate).toISOString().split("T")[0]
            : "",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar empresa:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/super-admin/companies/${resolvedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchCompany();
        setEditing(false);
      } else {
        const error = await res.json();
        alert(error.message || "Erro ao atualizar empresa");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao atualizar empresa");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const res = await fetch(`/api/super-admin/companies/${resolvedParams.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/super-admin/companies");
      } else {
        const error = await res.json();
        alert(error.message || "Erro ao excluir empresa");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao excluir empresa");
    }
  }

  if (loading && !company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/companies">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Carregando...</h1>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/companies">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Empresa não encontrada</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/companies">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <Building2 className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <p className="text-muted-foreground">
                Criada em {new Date(company.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <Button onClick={() => setEditing(true)}>Editar</Button>
          )}
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company._count.users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company._count.contracts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company._count.assets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laudos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company._count.reports}</div>
          </CardContent>
        </Card>
      </div>

      {/* Informações da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">URL do Logo</Label>
                <Input
                  id="logo"
                  value={formData.logo}
                  onChange={(e) =>
                    setFormData({ ...formData, logo: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscriptionStatus">Status da Assinatura</Label>
                <select
                  id="subscriptionStatus"
                  value={formData.subscriptionStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscriptionStatus: e.target.value,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="TRIAL">Trial</option>
                  <option value="ACTIVE">Ativo</option>
                  <option value="SUSPENDED">Suspenso</option>
                  <option value="EXPIRED">Expirado</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expirationDate">Data de Expiração</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expirationDate: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={statusColors[company.subscriptionStatus]}
                >
                  {statusLabels[company.subscriptionStatus]}
                </Badge>
              </div>

              {company.expirationDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expira em</span>
                  <span className="text-sm font-medium">
                    {new Date(company.expirationDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários ({company.users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {company.users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant="outline">{user.role}</Badge>
              </div>
            ))}
            {company.users.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contratos */}
      <Card>
        <CardHeader>
          <CardTitle>Contratos ({company.contracts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {company.contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">{contract.name}</p>
                  <p className="text-sm text-muted-foreground">{contract.company}</p>
                </div>
                <Badge variant={contract.active ? "default" : "outline"}>
                  {contract.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            ))}
            {company.contracts.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum contrato cadastrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
