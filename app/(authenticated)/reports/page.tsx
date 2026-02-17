import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ReportsKanban } from "@/components/reports-kanban";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const whereClause = session.user.role === "ADMIN"
    ? {}
    : {
      contract: {
        users: { some: { userId: session.user.id } },
      },
    };

  const reports = await prisma.report.findMany({
    where: {
      ...whereClause,
      deletedAt: null,
    },
    include: {
      contract: { select: { name: true } },
      asset: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
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

      <ReportsKanban initialReports={reports} />
    </div>
  );
}
