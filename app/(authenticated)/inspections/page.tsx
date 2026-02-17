import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Play, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function InspectionsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const whereClause = session.user.role === "ADMIN"
    ? {}
    : {
        contract: {
          users: {
            some: { userId: session.user.id }
          }
        }
      };

  const inspections = await prisma.inspection.findMany({
    where: whereClause,
    include: {
      contract: { select: { name: true } },
      asset: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const pendingCount = inspections.filter((i: any) => i.status === "PENDING").length;
  const inProgressCount = inspections.filter((i: any) => i.status === "IN_PROGRESS").length;
  const completedCount = inspections.filter((i: any) => i.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rondas Técnicas</h1>
          <p className="text-muted-foreground">
            Execute e acompanhe as rondas técnicas
          </p>
        </div>
        <Link href="/inspections/new">
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Nova Ronda
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Rondas</CardTitle>
        </CardHeader>
        <CardContent>
          {inspections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhuma ronda encontrada</p>
              <Link href="/inspections/new">
                <Button variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar primeira ronda
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {inspections.map((inspection: any) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{inspection.asset.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {inspection.contract.name} • {inspection.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(inspection.startedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        inspection.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : inspection.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {inspection.status === "COMPLETED" ? "Concluída" :
                       inspection.status === "IN_PROGRESS" ? "Em andamento" : "Pendente"}
                    </span>
                    <Link href={`/inspections/${inspection.id}`}>
                      <Button variant="outline" size="sm">
                        {inspection.status === "COMPLETED" ? "Ver" : "Continuar"}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
