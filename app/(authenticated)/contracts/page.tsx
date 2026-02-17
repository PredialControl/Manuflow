import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Mail, Phone } from "lucide-react";

export default async function ContractsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const whereClause = (session.user.role === "ADMIN" || session.user.role === "OWNER")
    ? {}
    : {
      users: {
        some: { userId: session.user.id }
      }
    };

  const contracts = await prisma.contract.findMany({
    where: {
      ...whereClause,
      active: true,
      deletedAt: null,
    },
    include: {
      _count: {
        select: { assets: true, reports: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contratos</h1>
          <p className="text-muted-foreground">
            Gerencie seus contratos e clientes
          </p>
        </div>
        {session.user.role === "ADMIN" && (
          <Link href="/contracts/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </Link>
        )}
      </div>

      {contracts.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 bg-background rounded-2xl shadow-sm flex items-center justify-center mb-6">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Nenhum contrato ativo</h3>
            <p className="text-muted-foreground mb-8 text-center max-w-xs">
              Você ainda não possui contratos vinculados a esta conta.
            </p>
            {session.user.role === "ADMIN" && (
              <Link href="/contracts/new">
                <Button className="rounded-xl px-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro contrato
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contracts.map((contract: any) => (
            <Link key={contract.id} href={`/contracts/${contract.id}`} className="group">
              <Card className="card-premium h-full overflow-hidden border-border/40 hover:border-primary/50 transition-all duration-300">
                <CardHeader className="flex flex-row items-center gap-5 pb-4">
                  <div className="h-14 w-14 bg-primary/10 group-hover:bg-primary/20 rounded-2xl flex items-center justify-center transition-colors">
                    {contract.logo ? (
                      <img
                        src={contract.logo}
                        alt={contract.name}
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <Building2 className="h-7 w-7 text-primary/70" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-black tracking-tight truncate group-hover:text-primary transition-colors">
                      {contract.name}
                    </CardTitle>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 truncate">
                      {contract.company}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 opacity-60" />
                      <span className="truncate">{contract.email}</span>
                    </div>
                    {contract.phone && (
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 opacity-60" />
                        <span>{contract.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                    <div className="bg-muted px-2.5 py-1 rounded-lg">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">
                        {contract._count.assets} ativos
                      </span>
                    </div>
                    <div className="bg-muted px-2.5 py-1 rounded-lg">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">
                        {contract._count.reports} laudos
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
