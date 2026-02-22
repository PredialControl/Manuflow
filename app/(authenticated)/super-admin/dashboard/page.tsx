import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users } from "lucide-react";

export default async function SuperAdminDashboard() {
  const session = await getServerSession(authOptions);

  // Obter estatísticas de gestão
  const [
    totalCompanies,
    totalUsers,
    companies,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
            contracts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // Contar por status de assinatura
  const companiesByStatus = await prisma.company.groupBy({
    by: ["subscriptionStatus"],
    _count: true,
  });

  const statusCounts = {
    TRIAL: 0,
    ACTIVE: 0,
    SUSPENDED: 0,
    EXPIRED: 0,
  };

  companiesByStatus.forEach((item) => {
    statusCounts[item.subscriptionStatus] = item._count;
  });

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Global</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral de todas as empresas e dados do sistema
        </p>
      </div>

      {/* Estatísticas de Gestão */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Cadastradas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompanies}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de empresas clientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de logins cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status de Assinaturas */}
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card key={status}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {statusLabels[status as keyof typeof statusLabels]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
              <Badge
                variant="outline"
                className={`mt-2 ${statusColors[status as keyof typeof statusColors]}`}
              >
                {((count / totalCompanies) * 100).toFixed(0)}% do total
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empresas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
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
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {company._count.users} usuários • {company._count.contracts}{" "}
                      contratos
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={statusColors[company.subscriptionStatus]}
                >
                  {statusLabels[company.subscriptionStatus]}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
