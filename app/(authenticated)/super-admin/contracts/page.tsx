"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, FileText, AlertCircle, Search, DollarSign, Calendar } from "lucide-react";

interface Contract {
  id: string;
  name: string;
  company: {
    id: string;
    name: string;
    logo: string | null;
  };
  paymentStatus: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  paymentDueDate: string | null;
  monthlyValue: number | null;
  createdAt: string;
  companyOwner: {
    id: string;
    name: string;
  } | null;
}

const paymentStatusColors = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  PAID: "bg-green-500/10 text-green-500 border-green-500/20",
  OVERDUE: "bg-red-500/10 text-red-500 border-red-500/20",
  CANCELLED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const paymentStatusLabels = {
  PENDING: "Pendente",
  PAID: "Pago",
  OVERDUE: "Atrasado",
  CANCELLED: "Cancelado",
};

export default function SuperAdminContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredContracts = contracts.filter((contract) => {
    const search = searchTerm.toLowerCase();
    return (
      contract.name.toLowerCase().includes(search) ||
      contract.company.name.toLowerCase().includes(search) ||
      (contract.companyOwner?.name.toLowerCase().includes(search) ?? false)
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Contratos</h1>
        </div>
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contratos</h1>
          <p className="text-muted-foreground mt-1">
            Visualize todos os contratos cadastrados no sistema
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por contrato, empresa ou responsável..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContracts.map((contract) => (
          <Card
            key={contract.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(`/contracts/${contract.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg">{contract.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span>{contract.company.name}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status Pagamento</span>
                <Badge
                  variant="outline"
                  className={paymentStatusColors[contract.paymentStatus]}
                >
                  {paymentStatusLabels[contract.paymentStatus]}
                </Badge>
              </div>

              {contract.monthlyValue && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    Valor mensal
                  </span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(contract.monthlyValue)}
                  </span>
                </div>
              )}

              {contract.paymentDueDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Vencimento
                  </span>
                  <span className="font-medium">
                    {new Date(contract.paymentDueDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}

              {contract.companyOwner && (
                <div className="flex items-center justify-between text-sm pt-4 border-t">
                  <span className="text-muted-foreground">Responsável</span>
                  <span className="font-medium">{contract.companyOwner.name}</span>
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-2 border-t">
                Criado em {new Date(contract.createdAt).toLocaleDateString("pt-BR")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContracts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              {searchTerm ? "Nenhum contrato encontrado" : "Nenhum contrato cadastrado"}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? "Tente buscar com outros termos"
                : "Aguarde a criação de novos contratos"}
            </p>
          </CardContent>
        </Card>
      )}

      {!searchTerm && contracts.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Total de {contracts.length} {contracts.length === 1 ? "contrato" : "contratos"}
        </div>
      )}
    </div>
  );
}
