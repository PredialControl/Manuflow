"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Users, FileText, AlertCircle } from "lucide-react";

interface Company {
  id: string;
  name: string;
  logo: string | null;
  subscriptionStatus: "TRIAL" | "ACTIVE" | "SUSPENDED" | "EXPIRED";
  expirationDate: string | null;
  createdAt: string;
  _count: {
    users: number;
    contracts: number;
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

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    try {
      const res = await fetch("/api/super-admin/companies");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Empresas</h1>
        </div>
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Empresas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as empresas cadastradas no sistema
          </p>
        </div>
        <Button onClick={() => router.push("/super-admin/companies/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <Card
            key={company.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(`/super-admin/companies/${company.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <Building2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Criado em {new Date(company.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expira em</span>
                  <span className="font-medium">
                    {new Date(company.expirationDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-primary" />
                    <p className="text-xs font-medium text-muted-foreground">Usuários</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">{company._count.users}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {company._count.users === 1 ? 'login cadastrado' : 'logins cadastrados'}
                  </p>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <p className="text-xs font-medium text-muted-foreground">Contratos</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-500">{company._count.contracts}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {company._count.contracts === 1 ? 'contrato ativo' : 'contratos ativos'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {companies.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma empresa cadastrada</p>
            <p className="text-sm text-muted-foreground mb-4">
              Comece criando sua primeira empresa
            </p>
            <Button onClick={() => router.push("/super-admin/companies/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
