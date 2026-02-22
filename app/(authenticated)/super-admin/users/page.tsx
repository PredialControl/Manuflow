import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Building2, Mail, Key, Trash2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company: {
    id: string;
    name: string;
    subscriptionStatus: string;
  };
  _count: {
    contracts: number;
  };
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/super-admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(userId: string) {
    if (!newPassword) {
      alert("Digite uma nova senha");
      return;
    }

    try {
      const res = await fetch(`/api/super-admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          password: newPassword,
        }),
      });

      if (res.ok) {
        alert("Senha resetada com sucesso!");
        setResettingPassword(null);
        setNewPassword("");
      } else {
        const error = await res.json();
        alert(error.message || "Erro ao resetar senha");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao resetar senha");
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
        await fetchUsers();
      } else {
        const error = await res.json();
        alert(error.message || "Erro ao excluir usuário");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao excluir usuário");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
          <p className="text-muted-foreground mt-1">Carregando...</p>
        </div>
      </div>
    );
  }

  // Estatísticas
  const totalUsers = users.length;
  const usersByRole = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const usersByCompany = users.reduce((acc, user) => {
    acc[user.company.name] = (acc[user.company.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const roleColors = {
    SUPER_ADMIN: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    OWNER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    ADMIN: "bg-green-500/10 text-green-500 border-green-500/20",
    SUPERVISOR: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    TECHNICIAN: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };

  const roleLabels = {
    SUPER_ADMIN: "Super Admin",
    OWNER: "Proprietário",
    ADMIN: "Administrador",
    SUPERVISOR: "Supervisor",
    TECHNICIAN: "Técnico",
  };

  const statusColors = {
    TRIAL: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    ACTIVE: "bg-green-500/10 text-green-500 border-green-500/20",
    SUSPENDED: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    EXPIRED: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuários</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie todos os usuários do sistema
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(usersByRole.SUPER_ADMIN || 0) + (usersByRole.ADMIN || 0) + (usersByRole.OWNER || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supervisores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersByRole.SUPERVISOR || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Técnicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersByRole.TECHNICIAN || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Usuários ({totalUsers})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{user.name}</p>
                      <Badge variant="outline" className={roleColors[user.role as keyof typeof roleColors]}>
                        {roleLabels[user.role as keyof typeof roleLabels]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {user.company.name}
                      </div>
                      {user._count.contracts > 0 && (
                        <span>{user._count.contracts} contrato(s)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={statusColors[user.company.subscriptionStatus as keyof typeof statusColors]}
                    >
                      {user.company.subscriptionStatus}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setResettingPassword(user.id)}
                    >
                      <Key className="h-3 w-3 mr-1" />
                      Resetar Senha
                    </Button>
                    {user.role !== "SUPER_ADMIN" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {resettingPassword === user.id && (
                  <div className="flex items-center gap-2 mt-2 p-3 bg-muted/50 rounded-lg">
                    <Input
                      type="text"
                      placeholder="Nova senha"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleResetPassword(user.id)}
                    >
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResettingPassword(null);
                        setNewPassword("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usuários por Empresa */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários por Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(usersByCompany)
              .sort((a, b) => b[1] - a[1])
              .map(([company, count]) => (
                <div
                  key={company}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{company}</span>
                  </div>
                  <Badge variant="outline">{count} usuário(s)</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
