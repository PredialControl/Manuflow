"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

const recurrenceTypes = [
  { value: "MONTHLY", label: "Mensal" },
  { value: "QUARTERLY", label: "Trimestral" },
  { value: "SEMIANNUAL", label: "Semestral" },
  { value: "ANNUAL", label: "Anual" },
];

export default function NewReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState("");

  useEffect(() => {
    loadContracts();
  }, []);

  async function loadContracts() {
    try {
      const res = await fetch("/api/contracts");
      const data = await res.json();
      setContracts(data);
    } catch (error) {
      console.error("Error loading contracts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAssets(contractId: string) {
    if (!contractId) {
      setAssets([]);
      return;
    }
    try {
      const res = await fetch(`/api/contracts/${contractId}/assets`);
      const data = await res.json();
      setAssets(data);
    } catch (error) {
      console.error("Error loading assets:", error);
    }
  }

  function handleContractChange(contractId: string) {
    setSelectedContract(contractId);
    loadAssets(contractId);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const formData = new FormData(event.currentTarget);
    const assetId = formData.get("assetId") as string;

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          contractId: formData.get("contractId"),
          assetId: assetId || null,
          title: formData.get("title"),
          executionDate: formData.get("executionDate"),
          expirationDate: formData.get("expirationDate"),
          recurrence: formData.get("recurrence"),
          technicalResponsible: formData.get("technicalResponsible"),
          crea: formData.get("crea"),
          notes: formData.get("notes") || undefined,
          recommendations: formData.get("recommendations") || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar laudo");
      }

      const report = await response.json();

      toast({
        title: "Sucesso",
        description: "Laudo criado com sucesso",
      });

      router.push(`/reports/${report.id}`);
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Novo Laudo</h1>
        <p className="text-muted-foreground">
          Crie um novo laudo técnico
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Laudo</CardTitle>
          <CardDescription>
            Preencha os dados do laudo técnico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contractId">Contrato</Label>
              <select
                id="contractId"
                name="contractId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
                onChange={(e) => handleContractChange(e.target.value)}
              >
                <option value="">Selecione o contrato</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetId">Ativo (opcional)</Label>
              <select
                id="assetId"
                name="assetId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!selectedContract}
              >
                <option value="">Geral (sem ativo específico)</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título do Laudo</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Laudo Técnico - Gerador Principal"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="executionDate">Data de Execução</Label>
                <Input
                  id="executionDate"
                  name="executionDate"
                  type="date"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Data de Vencimento</Label>
                <Input
                  id="expirationDate"
                  name="expirationDate"
                  type="date"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrence">Recorrência</Label>
              <select
                id="recurrence"
                name="recurrence"
                defaultValue="MONTHLY"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {recurrenceTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="technicalResponsible">Responsável Técnico</Label>
              <Input
                id="technicalResponsible"
                name="technicalResponsible"
                placeholder="Nome do responsável técnico"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="crea">CREA</Label>
              <Input
                id="crea"
                name="crea"
                placeholder="Número do CREA"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <textarea
                id="notes"
                name="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Observações adicionais..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations">Recomendações (opcional)</Label>
              <textarea
                id="recommendations"
                name="recommendations"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Recomendações..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Criando..." : "Criar Laudo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
