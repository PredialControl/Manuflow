"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

interface Company {
  id: string;
  name: string;
  logo: string | null;
  subscriptionStatus: "TRIAL" | "ACTIVE" | "SUSPENDED" | "EXPIRED";
  expirationDate: string | null;
  contractDate: string | null;
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

const statusIcons = {
  TRIAL: Clock,
  ACTIVE: CheckCircle,
  SUSPENDED: AlertCircle,
  EXPIRED: XCircle,
};

export default function FinancialPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "TRIAL" | "ACTIVE" | "SUSPENDED" | "EXPIRED">("ALL");

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

  const filteredCompanies = filter === "ALL"
    ? companies
    : companies.filter(c => c.subscriptionStatus === filter);

  const stats = {
    total: companies.length,
    trial: companies.filter(c => c.subscriptionStatus === "TRIAL").length,
    active: companies.filter(c => c.subscriptionStatus === "ACTIVE").length,
    suspended: companies.filter(c => c.subscriptionStatus === "SUSPENDED").length,
    expired: companies.filter(c => c.subscriptionStatus === "EXPIRED").length,
    expiringSoon: companies.filter(c => {
      if (!c.expirationDate) return false;
      const daysUntilExpiration = Math.ceil((new Date(c.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiration > 0 && daysUntilExpiration <= 30 && c.subscriptionStatus === "ACTIVE";
    }).length,
  };

  function getDaysUntilExpiration(expirationDate: string | null): number | null {
    if (!expirationDate) return null;
    return Math.ceil((new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Painel Financeiro</h1>
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Painel Financeiro</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe os status de assinatura e pagamentos das empresas
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter("ALL")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter("TRIAL")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.trial}</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter("ACTIVE")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencem em 30d</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.expiringSoon}</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter("SUSPENDED")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspensos</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.suspended}</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter("EXPIRED")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirados</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro ativo */}
      {filter !== "ALL" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtro ativo:</span>
          <Badge variant="outline" className={statusColors[filter]}>
            {statusLabels[filter]}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setFilter("ALL")}>
            Limpar filtro
          </Button>
        </div>
      )}

      {/* Lista de empresas */}
      <Card>
        <CardHeader>
          <CardTitle>
            Empresas ({filteredCompanies.length})
            {filter !== "ALL" && ` - ${statusLabels[filter]}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredCompanies.map((company) => {
              const daysUntilExpiration = getDaysUntilExpiration(company.expirationDate);
              const StatusIcon = statusIcons[company.subscriptionStatus];
              const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration > 0 && daysUntilExpiration <= 30 && company.subscriptionStatus === "ACTIVE";

              return (
                <div
                  key={company.id}
                  className={`border rounded-lg p-4 ${isExpiringSoon ? 'border-orange-500/40 bg-orange-500/5' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-lg">{company.name}</p>
                          <Badge variant="outline" className={statusColors[company.subscriptionStatus]}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusLabels[company.subscriptionStatus]}
                          </Badge>
                          {isExpiringSoon && (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Vence em {daysUntilExpiration} dias
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{company._count.users} usuários</span>
                          <span>{company._count.contracts} contratos</span>
                          {company.contractDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Contratado em {new Date(company.contractDate).toLocaleDateString("pt-BR")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {company.expirationDate && (
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-sm text-muted-foreground">Data de Expiração</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          daysUntilExpiration !== null && daysUntilExpiration < 0
                            ? 'text-red-500'
                            : isExpiringSoon
                            ? 'text-orange-500'
                            : 'text-green-500'
                        }`}>
                          {new Date(company.expirationDate).toLocaleDateString("pt-BR")}
                        </span>
                        {daysUntilExpiration !== null && (
                          <span className={`text-xs ${
                            daysUntilExpiration < 0
                              ? 'text-red-500'
                              : isExpiringSoon
                              ? 'text-orange-500'
                              : 'text-muted-foreground'
                          }`}>
                            {daysUntilExpiration < 0
                              ? `Expirado há ${Math.abs(daysUntilExpiration)} dias`
                              : `Faltam ${daysUntilExpiration} dias`
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredCompanies.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma empresa encontrada com este filtro
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
