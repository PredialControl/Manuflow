import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Mail } from "lucide-react";

export default async function SuperAdminUsersPage() {
  const session = await getServerSession(authOptions);

  // Obter todos os usuários de todas as empresas
  const users = await prisma.user.findMany({
    include: {
      company: {
        select: {
          id: true,
          name: true,
          subscriptionStatus: true,
        },
      },
      _count: {
        select: {
          contracts: true,
        },
      },
    },
    orderBy: [
      { company: { name: "asc" } },
      { role: "asc" },
      { name: "asc" },
    ],
  });

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
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
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
                <Badge
                  variant="outline"
                  className={statusColors[user.company.subscriptionStatus]}
                >
                  {user.company.subscriptionStatus}
                </Badge>
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
