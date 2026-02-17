import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TechnicianDashboard } from "@/components/technician-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const whereClause = session.user.role === "ADMIN"
    ? {}
    : {
      users: {
        some: { userId: session.user.id }
      }
    };

  const [contracts, reports] = await Promise.all([
    prisma.contract.count({
      where: { ...whereClause, active: true },
    }),
    prisma.report.findMany({
      where: {
        contract: whereClause,
        deletedAt: null,
      },
      select: {
        expirationDate: true,
        status: true,
      },
    }),
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
    </div>
  );
}
