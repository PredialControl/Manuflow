import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, AlertTriangle, CheckCircle, TrendingUp, DollarSign, XCircle, PauseCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TechnicianDashboard } from "@/components/technician-dashboard";
import { getContractWhereClause, getCompanyWhereClause } from "@/lib/multi-tenancy";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Cache por 60 segundos

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const contractWhereClause = getContractWhereClause(session);
  const companyWhereClause = getCompanyWhereClause(session);

  const isOwner = session.user.role === "OWNER";
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "OWNER";

  const [contracts, reports, allContracts] = await Promise.all([
    prisma.contract.count({
      where: { ...contractWhereClause, active: true },
    }),
    prisma.report.findMany({
      where: {
        ...companyWhereClause,
        deletedAt: null,
      },
      select: {
        expirationDate: true,
        status: true,
      },
    }),
    // Buscar todos os contratos com detalhes financeiros para OWNER/ADMIN
    isOwner || isAdmin ? prisma.contract.findMany({
      where: { ...contractWhereClause, active: true },
      select: {
        id: true,
        name: true,
        company: true,
        paymentStatus: true,
        paymentDueDate: true,
        monthlyValue: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }) : Promise.resolve([]),
  ]);

  const now = new Date();
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  type ReportData = { expirationDate: Date; status: string };
  const expired = reports.filter((r: ReportData) => new Date(r.expirationDate) < now).length;
  const expiringSoon = reports.filter((r: ReportData) => {
    const expDate = new Date(r.expirationDate);
    return expDate >= now && expDate <= in60Days;
  }).length;
  const inDay = reports.filter((r: ReportData) => new Date(r.expirationDate) > in60Days).length;

  const totalReports = reports.length;
  const complianceRate = totalReports > 0
    ? Math.round((inDay / totalReports) * 100)
    : 100;

  const complianceColor = complianceRate >= 90
    ? "text-emerald-600 dark:text-emerald-400"
    : complianceRate >= 70
      ? "text-amber-600 dark:text-amber-400"
      : "text-rose-600 dark:text-rose-400";

  const complianceBg = complianceRate >= 90
    ? "bg-emerald-500/5"
    : complianceRate >= 70
      ? "bg-amber-500/5"
      : "bg-rose-500/5";

  // Calcular métricas financeiras para OWNER/ADMIN
  const contractsEmDia = allContracts.filter(c => c.paymentStatus === "EM_DIA");
  const contractsVencidos = allContracts.filter(c => c.paymentStatus === "VENCIDO");
  const contractsSuspensos = allContracts.filter(c => c.paymentStatus === "SUSPENSO");
  const contractsCancelados = allContracts.filter(c => c.paymentStatus === "CANCELADO");

  const receitaMensal = contractsEmDia.reduce((sum, c) => sum + (c.monthlyValue || 0), 0);
  const receitaPotencialVencida = contractsVencidos.reduce((sum, c) => sum + (c.monthlyValue || 0), 0);

  if (session.user.role === "TECHNICIAN" || session.user.role === "SUPERVISOR") {
    return <TechnicianDashboard />;
  }

  return (
    <div className="space-y-8 w-full">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-foreground">Visão Geral</h1>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">
          Monitoramento de Conformidade e Contratos
        </p>
      </div>

      {/* Dashboard Financeiro - Apenas para OWNER/ADMIN */}
      {(isOwner || isAdmin) && (
        <>
          <div>
            <h2 className="text-xl font-black tracking-tight uppercase text-muted-foreground/40 italic mb-4">
              Status Financeiro
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="card-premium group border-emerald-500/40 bg-emerald-500/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                    Contratos Em Dia
                  </span>
                  <CheckCircle className="h-4 w-4 text-emerald-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black tracking-tighter text-emerald-600">
                    {contractsEmDia.length}
                  </div>
                  <p className="text-xs text-emerald-600/70 font-bold mt-2">
                    R$ {receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                  </p>
                </CardContent>
              </Card>

              <Card className="card-premium group border-rose-500/40 bg-rose-500/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">
                    Inadimplentes
                  </span>
                  <XCircle className="h-4 w-4 text-rose-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black tracking-tighter text-rose-600">
                    {contractsVencidos.length}
                  </div>
                  <p className="text-xs text-rose-600/70 font-bold mt-2">
                    R$ {receitaPotencialVencida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês em risco
                  </p>
                </CardContent>
              </Card>

              <Card className="card-premium group border-amber-500/40 bg-amber-500/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                    Suspensos
                  </span>
                  <PauseCircle className="h-4 w-4 text-amber-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black tracking-tighter text-amber-600">
                    {contractsSuspensos.length}
                  </div>
                  <p className="text-xs text-amber-600/70 font-bold mt-2">
                    Temporariamente inativos
                  </p>
                </CardContent>
              </Card>

              <Card className="card-premium group border-primary/40 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Receita Mensal
                  </span>
                  <DollarSign className="h-4 w-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black tracking-tighter text-primary">
                    R$ {receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-primary/70 font-bold mt-2">
                    {contractsEmDia.length} contrato{contractsEmDia.length !== 1 ? 's' : ''} ativo{contractsEmDia.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight uppercase text-muted-foreground/40 italic mb-4">
              Conformidade Técnica
            </h2>
          </div>
        </>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Contratos Ativos", value: contracts, icon: Building2, link: "/contracts" },
          { label: "Total de Laudos", value: totalReports, icon: FileText, link: "/reports" },
          { label: "A Vencer (60d)", value: expiringSoon, icon: AlertTriangle, color: "text-amber-500" },
          { label: "Laudos Vencidos", value: expired, icon: AlertTriangle, color: "text-rose-500" },
        ].map((stat, i) => (
          <Card key={i} className="card-premium group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </span>
              <stat.icon className={cn("h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-black tracking-tighter", stat.color || "text-foreground")}>
                {stat.value}
              </div>
              {stat.link && (
                <Link href={stat.link} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter mt-2 inline-block">
                  Acessar registros →
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={cn("border-border/50 shadow-xl rounded-3xl overflow-hidden", complianceBg)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-8">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <TrendingUp className="h-5 w-5 text-primary" />
              Índice de Conformidade Geral
            </CardTitle>
            <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-widest">
              {inDay} laudos em conformidade de {totalReports} mapeados
            </p>
          </div>
          <div className={cn("text-5xl font-black tracking-tighter", complianceColor)}>
            {complianceRate}%
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(0,0,0,0.1)]",
                complianceRate >= 90 ? "bg-emerald-500" : complianceRate >= 70 ? "bg-amber-500" : "bg-rose-500"
              )}
              style={{ width: `${complianceRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { title: "Em dia", value: inDay, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { title: "Próximo vencimento", value: expiringSoon, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
          { title: "Vencidos", value: expired, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10" },
        ].map((item, i) => (
          <Card key={i} className="card-premium border-none bg-muted/40 group hover:bg-muted/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className={cn("text-3xl font-black tracking-tighter", item.color)}>
                  {item.value}
                </div>
                <div className={cn("p-2 rounded-xl group-hover:scale-110 transition-transform", item.bg)}>
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de Contratos com Status de Pagamento - Apenas para OWNER/ADMIN */}
      {(isOwner || isAdmin) && allContracts.length > 0 && (
        <div>
          <h2 className="text-xl font-black tracking-tight uppercase text-muted-foreground/40 italic mb-4">
            Status dos Contratos
          </h2>
          <Card className="border-border/60 shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 p-6">
              <CardTitle className="text-lg font-bold text-primary">
                Todos os Contratos ({allContracts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {allContracts.map((contract) => (
                  <Link
                    key={contract.id}
                    href={`/contracts/${contract.id}`}
                    className="block"
                  >
                    <div className={cn(
                      "p-4 rounded-xl border-2 transition-all hover:scale-[1.01] hover:shadow-lg",
                      contract.paymentStatus === "EM_DIA" && "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60",
                      contract.paymentStatus === "VENCIDO" && "border-rose-500/40 bg-rose-500/5 hover:border-rose-500/60",
                      contract.paymentStatus === "SUSPENSO" && "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60",
                      contract.paymentStatus === "CANCELADO" && "border-muted bg-muted/20 hover:border-muted-foreground/40"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center",
                            contract.paymentStatus === "EM_DIA" && "bg-emerald-500/20 text-emerald-600",
                            contract.paymentStatus === "VENCIDO" && "bg-rose-500/20 text-rose-600",
                            contract.paymentStatus === "SUSPENSO" && "bg-amber-500/20 text-amber-600",
                            contract.paymentStatus === "CANCELADO" && "bg-muted text-muted-foreground"
                          )}>
                            <Building2 className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-black uppercase italic tracking-tighter text-lg">
                              {contract.name}
                            </h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              {contract.company}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {contract.monthlyValue && (
                            <div className="text-right">
                              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                Valor Mensal
                              </p>
                              <p className="text-lg font-black text-foreground">
                                R$ {contract.monthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          )}

                          <div className={cn(
                            "px-4 py-2 rounded-xl font-black uppercase tracking-widest text-xs",
                            contract.paymentStatus === "EM_DIA" && "bg-emerald-500/20 text-emerald-700 border-2 border-emerald-500/40",
                            contract.paymentStatus === "VENCIDO" && "bg-rose-500/20 text-rose-700 border-2 border-rose-500/40",
                            contract.paymentStatus === "SUSPENSO" && "bg-amber-500/20 text-amber-700 border-2 border-amber-500/40",
                            contract.paymentStatus === "CANCELADO" && "bg-muted text-muted-foreground border-2 border-border"
                          )}>
                            {contract.paymentStatus === "EM_DIA" && "✓ EM DIA"}
                            {contract.paymentStatus === "VENCIDO" && "✗ INADIMPLENTE"}
                            {contract.paymentStatus === "SUSPENSO" && "⊘ SUSPENSO"}
                            {contract.paymentStatus === "CANCELADO" && "− CANCELADO"}
                          </div>
                        </div>
                      </div>

                      {contract.paymentDueDate && (
                        <div className="mt-3 pt-3 border-t border-border/20">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Vencimento: {new Date(contract.paymentDueDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
