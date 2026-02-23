"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, AlertCircle, CheckCircle, Clock, XCircle, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";

interface Contract {
  id: string;
  name: string;
  company: string;
  paymentStatus: "EM_DIA" | "VENCIDO" | "SUSPENSO" | "CANCELADO";
  paymentDueDate: string | null;
  monthlyValue: number | null;
  createdAt: string;
  companyOwner: {
    id: string;
    name: string;
  };
}

const statusColors = {
  EM_DIA: "bg-green-500/10 text-green-500 border-green-500/20",
  VENCIDO: "bg-red-500/10 text-red-500 border-red-500/20",
  SUSPENSO: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  CANCELADO: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const statusLabels = {
  EM_DIA: "Em Dia",
  VENCIDO: "Vencido",
  SUSPENSO: "Suspenso",
  CANCELADO: "Cancelado",
};

const statusIcons = {
  EM_DIA: CheckCircle,
  VENCIDO: XCircle,
  SUSPENSO: AlertCircle,
  CANCELADO: Clock,
};

export default function FinancialPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "EM_DIA" | "VENCIDO" | "SUSPENSO" | "CANCELADO">("ALL");

  useEffect(() => {
    fetchContracts();
  }, []);

  async function fetchContracts() {
    try {
      const res = await fetch("/api/super-admin/contracts");
      if (res.ok) {
        const data = await res.json();
        setContracts(data);
      }
    } catch (error) {
      console.error("Erro ao buscar contratos:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredContracts = filter === "ALL"
    ? contracts
    : contracts.filter(c => c.paymentStatus === filter);

  const stats = {
    total: contracts.length,
    emDia: contracts.filter(c => c.paymentStatus === "EM_DIA").length,
    vencidos: contracts.filter(c => c.paymentStatus === "VENCIDO").length,
    suspensos: contracts.filter(c => c.paymentStatus === "SUSPENSO").length,
    cancelados: contracts.filter(c => c.paymentStatus === "CANCELADO").length,
    vencendoEm7Dias: contracts.filter(c => {
      if (!c.paymentDueDate) return false;
      const daysUntilDue = Math.ceil((new Date(c.paymentDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilDue > 0 && daysUntilDue <= 7 && c.paymentStatus === "EM_DIA";
    }).length,
    totalReceita: contracts
      .filter(c => c.paymentStatus === "EM_DIA" && c.monthlyValue)
      .reduce((sum, c) => sum + (c.monthlyValue || 0), 0),
  };

  function getDaysUntilDue(dueDate: string | null): number | null {
    if (!dueDate) return null;
    return Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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
        <h1 className="text-3xl font-bold">Painel Financeiro - Contratos</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe os status de pagamento dos contratos
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
            <p className="text-xs text-muted-foreground mt-1">Contratos</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter("EM_DIA")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Dia</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.emDia}</div>
            <p className="text-xs text-muted-foreground mt-1">Pagamentos ok</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter("VENCIDO")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.vencidos}</div>
            <p className="text-xs text-muted-foreground mt-1">Inadimplentes</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencem em 7d</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.vencendoEm7Dias}</div>
            <p className="text-xs text-muted-foreground mt-1">Próximos</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter("SUSPENSO")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspensos</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.suspensos}</div>
            <p className="text-xs text-muted-foreground mt-1">Temporário</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter("CANCELADO")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats.cancelados}</div>
            <p className="text-xs text-muted-foreground mt-1">Inativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Receita Total */}
      <Card className="border-green-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Mensal (Contratos em Dia)</CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-500">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalReceita)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.emDia} contratos ativos
          </p>
        </CardContent>
      </Card>

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

      {/* Lista de contratos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Contratos ({filteredContracts.length})
            {filter !== "ALL" && ` - ${statusLabels[filter]}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredContracts.map((contract) => {
              const daysUntilDue = getDaysUntilDue(contract.paymentDueDate);
              const StatusIcon = statusIcons[contract.paymentStatus];
              const isDueSoon = daysUntilDue !== null && daysUntilDue > 0 && daysUntilDue <= 7 && contract.paymentStatus === "EM_DIA";

              return (
                <div
                  key={contract.id}
                  className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${isDueSoon ? 'border-orange-500/40 bg-orange-500/5' : ''}`}
                  onClick={() => router.push(`/super-admin/companies/${contract.companyOwner.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-lg">{contract.name}</p>
                        <Badge variant="outline" className={statusColors[contract.paymentStatus]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusLabels[contract.paymentStatus]}
                        </Badge>
                        {isDueSoon && (
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Vence em {daysUntilDue} dias
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {contract.companyOwner.name}
                        </div>
                        <span>{contract.company}</span>
                        {contract.monthlyValue && (
                          <div className="flex items-center gap-1 font-medium text-green-600">
                            <DollarSign className="h-3 w-3" />
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.monthlyValue)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {contract.paymentDueDate && (
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-sm text-muted-foreground">Próximo Vencimento</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          daysUntilDue !== null && daysUntilDue < 0
                            ? 'text-red-500'
                            : isDueSoon
                            ? 'text-orange-500'
                            : 'text-green-500'
                        }`}>
                          {new Date(contract.paymentDueDate).toLocaleDateString("pt-BR")}
                        </span>
                        {daysUntilDue !== null && (
                          <span className={`text-xs ${
                            daysUntilDue < 0
                              ? 'text-red-500'
                              : isDueSoon
                              ? 'text-orange-500'
                              : 'text-muted-foreground'
                          }`}>
                            {daysUntilDue < 0
                              ? `Atrasado ${Math.abs(daysUntilDue)} dias`
                              : `Faltam ${daysUntilDue} dias`
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredContracts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum contrato encontrado com este filtro
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
