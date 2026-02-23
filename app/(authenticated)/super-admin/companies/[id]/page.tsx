"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Users, FileText, Trash2, Edit2, Key } from "lucide-react";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  address: string | null;
  responsibleEmail: string | null;
  logo: string | null;
  contractDate: string | null;
  subscriptionStatus: "TRIAL" | "ACTIVE" | "SUSPENDED" | "EXPIRED";
  expirationDate: string | null;
  createdAt: string;
  users: Array<{ id: string; name: string; email: string; role: string; createdAt: string }>;
  contracts: Array<{
    id: string;
    name: string;
    company: string;
    active: boolean;
    paymentStatus: "EM_DIA" | "VENCIDO" | "SUSPENSO" | "CANCELADO";
    paymentDueDate: string | null;
    monthlyValue: number | null;
    createdAt: string;
  }>;
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

const paymentStatusColors = {
  EM_DIA: "bg-green-500/10 text-green-500 border-green-500/20",
  VENCIDO: "bg-red-500/10 text-red-500 border-red-500/20",
  SUSPENSO: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  CANCELADO: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const paymentStatusLabels = {
  EM_DIA: "Em Dia",
  VENCIDO: "Vencido",
  SUSPENSO: "Suspenso",
  CANCELADO: "Cancelado",
};

export default function CompanyDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [editUserForm, setEditUserForm] = useState({
    role: "",
    password: "",
  });
  const [editContractForm, setEditContractForm] = useState({
    paymentStatus: "",
    paymentDueDate: "",
    monthlyValue: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    address: "",
    responsibleEmail: "",
    logo: "",
    contractDate: "",
    subscriptionStatus: "TRIAL",
    expirationDate: "",
  });

  useEffect(() => {
    fetchCompany();
  }, []);

  async function fetchCompany() {
    try {
      const res = await fetch(`/api/super-admin/companies/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setCompany(data);
        setFormData({
          name: data.name,
          cnpj: data.cnpj || "",
          address: data.address || "",
          responsibleEmail: data.responsibleEmail || "",
          logo: data.logo || "",
          contractDate: data.contractDate
            ? new Date(data.contractDate).toISOString().split("T")[0]
            : "",
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
      const res = await fetch(`/api/super-admin/companies/${params.id}`, {
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
      const res = await fetch(`/api/super-admin/companies/${params.id}`, {
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

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...adminForm,
          companyId: params.id,
        }),
      });

      if (res.ok) {
        alert("Admin criado com sucesso!");
        setCreatingAdmin(false);
        setAdminForm({ name: "", email: "", password: "" });
        await fetchCompany();
      } else {
        const error = await res.json();
        alert(error.message || "Erro ao criar admin");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao criar admin");
    } finally {
      setLoading(false);
    }
  }

  async function handleEditUser(userId: string, e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const updates: any = {};
      if (editUserForm.role) updates.role = editUserForm.role;
      if (editUserForm.password) updates.password = editUserForm.password;

      const res = await fetch(`/api/super-admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-user", ...updates }),
      });

      if (res.ok) {
        alert("Usuário atualizado com sucesso!");
        setEditingUserId(null);
        setEditUserForm({ role: "", password: "" });
        await fetchCompany();
      } else {
        const error = await res.json();
        alert(error.message || "Erro ao atualizar usuário");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao atualizar usuário");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(userId: string, userName: string) {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${userName}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/super-admin/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Usuário excluído com sucesso!");
        await fetchCompany();
      } else {
        const error = await res.json();
        alert(error.message || "Erro ao excluir usuário");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao excluir usuário");
    }
  }

  async function handleEditContract(contractId: string, e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const updates: any = {};
      if (editContractForm.paymentStatus) updates.paymentStatus = editContractForm.paymentStatus;
      if (editContractForm.paymentDueDate) updates.paymentDueDate = editContractForm.paymentDueDate;
      if (editContractForm.monthlyValue) updates.monthlyValue = parseFloat(editContractForm.monthlyValue);

      const res = await fetch(`/api/super-admin/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        alert("Contrato atualizado com sucesso!");
        setEditingContractId(null);
        setEditContractForm({ paymentStatus: "", paymentDueDate: "", monthlyValue: "" });
        await fetchCompany();
      } else {
        const error = await res.json();
        alert(error.message || "Erro ao atualizar contrato");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao atualizar contrato");
    } finally {
      setLoading(false);
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
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company._count.users}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {company._count.users === 1 ? 'login cadastrado' : 'logins cadastrados'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company._count.contracts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {company._count.contracts === 1 ? 'unidade cadastrada' : 'unidades cadastradas'}
            </p>
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
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
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) =>
                      setFormData({ ...formData, cnpj: e.target.value })
                    }
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Rua, número, bairro, cidade - UF"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="responsibleEmail">Email do Responsável</Label>
                  <Input
                    id="responsibleEmail"
                    type="email"
                    value={formData.responsibleEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, responsibleEmail: e.target.value })
                    }
                    placeholder="responsavel@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractDate">Data de Contratação</Label>
                  <Input
                    id="contractDate"
                    type="date"
                    value={formData.contractDate}
                    onChange={(e) =>
                      setFormData({ ...formData, contractDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">URL do Logo/Foto</Label>
                <Input
                  id="logo"
                  value={formData.logo}
                  onChange={(e) =>
                    setFormData({ ...formData, logo: e.target.value })
                  }
                  placeholder="https://exemplo.com/logo.png"
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
              {company.cnpj && (
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-sm text-muted-foreground">CNPJ</span>
                  <span className="text-sm font-medium">{company.cnpj}</span>
                </div>
              )}

              {company.address && (
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-sm text-muted-foreground">Endereço</span>
                  <span className="text-sm font-medium">{company.address}</span>
                </div>
              )}

              {company.responsibleEmail && (
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-sm text-muted-foreground">Email do Responsável</span>
                  <span className="text-sm font-medium">{company.responsibleEmail}</span>
                </div>
              )}

              {company.contractDate && (
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-sm text-muted-foreground">Data de Contratação</span>
                  <span className="text-sm font-medium">
                    {new Date(company.contractDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-b pb-3">
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Usuários ({company.users.length})</CardTitle>
          <Button onClick={() => setCreatingAdmin(!creatingAdmin)} size="sm">
            {creatingAdmin ? "Cancelar" : "+ Criar Admin"}
          </Button>
        </CardHeader>
        <CardContent>
          {creatingAdmin && (
            <form onSubmit={handleCreateAdmin} className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-medium">Novo Administrador</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Nome</Label>
                  <Input
                    id="admin-name"
                    value={adminForm.name}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, name: e.target.value })
                    }
                    required
                    placeholder="João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminForm.email}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, email: e.target.value })
                    }
                    required
                    placeholder="admin@empresa.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Senha</Label>
                <Input
                  id="admin-password"
                  type="text"
                  value={adminForm.password}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, password: e.target.value })
                  }
                  required
                  placeholder="Senha do administrador"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Criando..." : "Criar Admin"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreatingAdmin(false);
                    setAdminForm({ name: "", email: "", password: "" });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {company.users.map((user) => (
              <div key={user.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{user.role}</Badge>
                    {user.role !== "SUPER_ADMIN" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingUserId(user.id);
                            setEditUserForm({ role: user.role, password: "" });
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {editingUserId === user.id && (
                  <form onSubmit={(e) => handleEditUser(user.id, e)} className="mt-3 p-3 bg-muted/50 rounded-lg space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`role-${user.id}`}>Tipo de Usuário</Label>
                        <select
                          id={`role-${user.id}`}
                          value={editUserForm.role}
                          onChange={(e) =>
                            setEditUserForm({ ...editUserForm, role: e.target.value })
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="OWNER">Proprietário</option>
                          <option value="ADMIN">Administrador</option>
                          <option value="SUPERVISOR">Supervisor</option>
                          <option value="TECHNICIAN">Técnico</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`password-${user.id}`}>Nova Senha (opcional)</Label>
                        <Input
                          id={`password-${user.id}`}
                          type="text"
                          value={editUserForm.password}
                          onChange={(e) =>
                            setEditUserForm({ ...editUserForm, password: e.target.value })
                          }
                          placeholder="Deixe em branco para não alterar"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={loading}>
                        {loading ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingUserId(null);
                          setEditUserForm({ role: "", password: "" });
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
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
              <div key={contract.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium">{contract.name}</p>
                    <p className="text-sm text-muted-foreground">{contract.company}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={paymentStatusColors[contract.paymentStatus]}>
                      {paymentStatusLabels[contract.paymentStatus]}
                    </Badge>
                    {contract.monthlyValue && (
                      <span className="text-sm font-medium text-green-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.monthlyValue)}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingContractId(contract.id);
                        setEditContractForm({
                          paymentStatus: contract.paymentStatus,
                          paymentDueDate: contract.paymentDueDate ? new Date(contract.paymentDueDate).toISOString().split("T")[0] : "",
                          monthlyValue: contract.monthlyValue?.toString() || "",
                        });
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {editingContractId === contract.id && (
                  <form onSubmit={(e) => handleEditContract(contract.id, e)} className="mt-3 p-3 bg-muted/50 rounded-lg space-y-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor={`status-${contract.id}`}>Status de Pagamento</Label>
                        <select
                          id={`status-${contract.id}`}
                          value={editContractForm.paymentStatus}
                          onChange={(e) =>
                            setEditContractForm({ ...editContractForm, paymentStatus: e.target.value })
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="EM_DIA">Em Dia</option>
                          <option value="VENCIDO">Vencido</option>
                          <option value="SUSPENSO">Suspenso</option>
                          <option value="CANCELADO">Cancelado</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`duedate-${contract.id}`}>Data de Vencimento</Label>
                        <Input
                          id={`duedate-${contract.id}`}
                          type="date"
                          value={editContractForm.paymentDueDate}
                          onChange={(e) =>
                            setEditContractForm({ ...editContractForm, paymentDueDate: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`value-${contract.id}`}>Valor Mensal (R$)</Label>
                        <Input
                          id={`value-${contract.id}`}
                          type="number"
                          step="0.01"
                          value={editContractForm.monthlyValue}
                          onChange={(e) =>
                            setEditContractForm({ ...editContractForm, monthlyValue: e.target.value })
                          }
                          placeholder="1000.00"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={loading}>
                        {loading ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingContractId(null);
                          setEditContractForm({ paymentStatus: "", paymentDueDate: "", monthlyValue: "" });
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
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
