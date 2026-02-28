import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ReportsKanban } from "@/components/reports-kanban";
import { getCompanyWhereClause, isCompanyAdmin } from "@/lib/multi-tenancy";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const isOwnerOrAdmin = session.user.role === "OWNER" || isCompanyAdmin(session);
  const whereClause = getCompanyWhereClause(session);

  const reports = await prisma.report.findMany({
    where: {
      ...whereClause,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      status: true,
      executionDate: true,
      expirationDate: true,
      contract: { select: { name: true } },
      asset: { select: { name: true } },
      user: { select: { name: true } },
      photos: {
        select: {
          id: true,
          url: true,
          filename: true,
        },
        take: 3, // Só os 3 primeiros para o card
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100, // Limitar a 100 reports iniciais
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Laudos Técnicos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os laudos técnicos - Arraste os cards para mudar o status
          </p>
        </div>
        {session.user.role !== "TECHNICIAN" && (
          <Link href="/reports/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Laudo
            </Button>
          </Link>
        )}
      </div>

      <ReportsKanban initialReports={reports} isOwnerOrAdmin={isOwnerOrAdmin} />
    </div>
  );
}
