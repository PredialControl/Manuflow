import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Plus, Building2, FileText, ClipboardCheck, History, Settings, Package, MapPin, Users, User, UserPlus, Pencil, Trash2, Wrench } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ReportsKanban } from "@/components/reports-kanban";
import { RelevantItemsKanban } from "@/components/relevant-items-kanban";
import { MeasurementManager } from "@/components/measurement-manager";
import { SupervisorMeasurementsDashboard } from "@/components/supervisor-measurements-dashboard";
import { ChamadosKanban } from "@/components/chamados-kanban";

import { ContractUserActions } from "@/components/contract-user-actions";
import { ScheduleManager } from "@/components/schedule-manager";
import { DeleteAssetButton } from "@/components/delete-asset-button";
import { AssetsGridWithFilters } from "@/components/assets-grid-with-filters";
import { getContractWhereClause, isCompanyAdmin } from "@/lib/multi-tenancy";
import { getStatusLabel, getStatusClass } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function ContractDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const activeTab = searchParams.tab || "overview";

  const contractWhereClause = getContractWhereClause(session);

  const contract = await prisma.contract.findFirst({
    where: {
      id: params.id,
      active: true,
      deletedAt: null,
      ...contractWhereClause,
    },
    include: {
      assets: {
        where: { active: true },
        orderBy: { name: "asc" },
      },
      reports: {
        where: { deletedAt: null },
        include: {
          asset: true,
          user: { select: { name: true } },
          contract: { select: { name: true } },
          photos: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },

      },
      users: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              category: true,
              avatar: true,
            }
          }
        }
      },
      measurementDevices: {
        where: { active: true },
        include: {
          entries: {
            orderBy: { createdAt: "desc" },
            take: 15,
            include: { user: { select: { name: true } } }
          }
        },
        orderBy: { createdAt: "desc" },
      },
      relevantItems: {
        where: { deletedAt: null },
        include: {
          user: { select: { id: true, name: true, email: true } },
          attachments: {
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
          },
          history: {
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  } as any) as any;

  if (!contract) {
    redirect("/contracts");
  }

  const isOwner = session.user.role === "OWNER";
  const isAdmin = isCompanyAdmin(session);

  const reportStats = await prisma.report.groupBy({
    by: ["status"],
    where: {
      contractId: contract.id,
      deletedAt: null,
    },
    _count: true,
  });

  // Calcular métricas de conformidade
  const today = new Date();
  const expiredReports = contract.reports.filter((r: any) => new Date(r.expirationDate) < today);
  const assetsWithIssues = contract.assets.filter((a: any) =>
    a.operationalStatus === 'NOT_OPERATIONAL' || a.operationalStatus === 'MAINTENANCE'
  );
  const maintenanceAssets = contract.assets.filter((a: any) => a.operationalStatus === 'MAINTENANCE');
  const stoppedAssets = contract.assets.filter((a: any) => a.operationalStatus === 'NOT_OPERATIONAL');
  const operationalAssets = contract.assets.filter((a: any) => a.operationalStatus === 'OPERATIONAL');

  // Calcular conformidade: 100% - penalidades
  // Cada laudo vencido: -10%
  // Cada ativo parado: -15%
  // Cada ativo em manutenção: -5%
  let complianceScore = 100;
  complianceScore -= expiredReports.length * 10;
  complianceScore -= stoppedAssets.length * 15;
  complianceScore -= maintenanceAssets.length * 5;
  complianceScore = Math.max(0, complianceScore); // Mínimo 0%

  return (
    <div className="space-y-8 w-full animate-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2 border-b border-border/40">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 bg-muted rounded-[2rem] border border-border/40 flex items-center justify-center shadow-inner overflow-hidden relative">
            {contract.logo ? (
              <img
                src={contract.logo}
                alt={contract.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-10 w-10 text-muted-foreground/40" />
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic">{contract.name}</h1>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">{contract.company}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <Link href={`/contracts/${contract.id}/edit`}>
              <Button variant="outline" size="icon" className="rounded-xl border-border/60 hover:bg-primary/5 hover:text-primary transition-all">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Tabs key={activeTab} value={activeTab} className="space-y-4">

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="card-premium group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Ativos
                </span>
                <Package className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tracking-tighter text-foreground">
                  {contract.assets.length}
                </div>
                {assetsWithIssues.length > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-2">
                    {assetsWithIssues.length} com problema{assetsWithIssues.length > 1 ? 's' : ''}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="card-premium group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Laudos
                </span>
                <FileText className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tracking-tighter text-foreground">
                  {contract.reports.length}
                </div>
                {expiredReports.length > 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-bold mt-2">
                    {expiredReports.length} vencido{expiredReports.length > 1 ? 's' : ''}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className={`card-premium group ${complianceScore < 70 ? 'border-amber-500/40' : complianceScore < 50 ? 'border-red-500/40' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Conformidade
                </span>
                <ClipboardCheck className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity text-primary" />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-black tracking-tighter ${complianceScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' : complianceScore >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                  {complianceScore}%
                </div>
                {complianceScore < 100 && (
                  <p className="text-xs text-muted-foreground font-bold mt-2">
                    {expiredReports.length > 0 && `${expiredReports.length} laudo${expiredReports.length > 1 ? 's' : ''} vencido${expiredReports.length > 1 ? 's' : ''}`}
                    {expiredReports.length > 0 && assetsWithIssues.length > 0 && ', '}
                    {assetsWithIssues.length > 0 && `${assetsWithIssues.length} ativo${assetsWithIssues.length > 1 ? 's' : ''}`}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="card-premium group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Status Ativos
                </span>
                <ClipboardCheck className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity text-primary" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-bold flex items-center gap-2">
                      <div className={`h-2 w-2 bg-emerald-500 rounded-full ${operationalAssets.length > 0 ? 'animate-pulse' : ''}`} />
                      Operacionais
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">{operationalAssets.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-bold flex items-center gap-2">
                      <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                      Manutenção
                    </span>
                    <span className="font-black text-yellow-600 dark:text-yellow-400">{maintenanceAssets.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-bold flex items-center gap-2">
                      <div className="h-2 w-2 bg-red-500 rounded-full" />
                      Parados
                    </span>
                    <span className="font-black text-red-600 dark:text-red-400">{stoppedAssets.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Últimos Laudos</CardTitle>
            </CardHeader>
            <CardContent>
              {contract.reports.length === 0 ? (
                <p className="text-muted-foreground">Nenhum laudo encontrado</p>
              ) : (
                <div className="space-y-4">
                  {contract.reports.map((report: any) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold tracking-tight">{report.title}</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">
                            {report.asset?.name || "Geral"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          Venc: {formatDate(report.expirationDate)}
                        </p>
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getStatusClass(report.status)}`}
                        >
                          {getStatusLabel(report.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black tracking-tight uppercase text-muted-foreground/40 italic">Ativos do Contrato</h2>
            {isAdmin && (
              <Link href={`/contracts/${contract.id}/assets/new`}>
                <Button size="sm" className="btn-premium">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Ativo
                </Button>
              </Link>
            )}
          </div>

          {contract.assets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum ativo encontrado</p>
                {isAdmin && (
                  <Link href={`/contracts/${contract.id}/assets/new`}>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar ativo
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <AssetsGridWithFilters
              assets={contract.assets}
              contractId={contract.id}
              isAdmin={isAdmin}
            />
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase text-muted-foreground/40 italic">Equipe Responsável</h2>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Colaboradores alocados neste contrato</p>
            </div>
            <div className="flex items-center gap-3">
              {(() => {
                const technicianCount = contract.users.filter((uc: any) => uc.user.role === "TECHNICIAN").length;
                return (
                  <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                    <Users className="h-4 w-4 text-primary" />
                    <div className="text-right">
                      <p className="text-xs font-black text-primary uppercase tracking-widest">
                        Técnicos
                      </p>
                      <p className={`text-lg font-black ${technicianCount >= 4 ? 'text-red-600' : 'text-primary'}`}>
                        {technicianCount}/4
                      </p>
                    </div>
                  </div>
                );
              })()}
              {isAdmin && (
                <Link href={`/contracts/${contract.id}/users/new`}>
                  <Button size="sm" className="btn-premium">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Colaborador
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            {contract.users.length === 0 ? (
              <Card className="border-dashed border-border/40 bg-muted/10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/20 mb-4" />
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Nenhum colaborador alocado</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Supervisores e Coordenadores */}
                {(() => {
                  const supervisors = contract.users.filter((uc: any) =>
                    uc.user.role === "SUPERVISOR" || uc.user.role === "ADMIN" || uc.user.role === "OWNER"
                  );

                  if (supervisors.length > 0) {
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                          <div className="h-1 w-1 rounded-full bg-blue-500" />
                          <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">
                            Coordenadores & Supervisores ({supervisors.length})
                          </h3>
                        </div>
                        <div className="grid gap-3">
                          {supervisors.map((uc: any) => (
                            <Card key={uc.userId} className="border-blue-500/40 rounded-2xl bg-blue-500/5 hover:border-blue-500/60 transition-all">
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-600">
                                    <User className="h-6 w-6" />
                                  </div>
                                  <div>
                                    <h4 className="font-black uppercase italic tracking-tighter text-lg">{uc.user.name}</h4>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{uc.user.email}</span>
                                      <span className="h-1 w-1 rounded-full bg-border" />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600/80">{uc.user.role}</span>
                                    </div>
                                  </div>
                                </div>

                                {isAdmin && (
                                  <ContractUserActions
                                    contractId={contract.id}
                                    userId={uc.userId}
                                    userName={uc.user.name}
                                  />
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Técnicos */}
                {(() => {
                  const technicians = contract.users.filter((uc: any) => uc.user.role === "TECHNICIAN");

                  if (technicians.length > 0) {
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                          <div className="h-1 w-1 rounded-full bg-primary" />
                          <h3 className="text-xs font-black uppercase tracking-widest text-primary">
                            Técnicos Residentes ({technicians.length}/4)
                          </h3>
                        </div>
                        <div className="grid gap-3">
                          {technicians.map((uc: any) => (
                            <Card key={uc.userId} className="border-border/60 rounded-2xl bg-muted/20 hover:border-primary/20 transition-all">
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <User className="h-6 w-6" />
                                  </div>
                                  <div>
                                    <h4 className="font-black uppercase italic tracking-tighter text-lg">{uc.user.name}</h4>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{uc.user.email}</span>
                                      {uc.user.category && (
                                        <>
                                          <span className="h-1 w-1 rounded-full bg-border" />
                                          <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{uc.user.category.replace('_', ' ')}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  {uc.user.category && (
                                    <div className="px-3 py-1 bg-background border border-border/40 rounded-full flex items-center gap-2">
                                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{uc.user.category.replace('_', ' ')}</span>
                                    </div>
                                  )}

                                  {isAdmin && (
                                    <ContractUserActions
                                      contractId={contract.id}
                                      userId={uc.userId}
                                      userName={uc.user.name}
                                    />
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-4">
          <ScheduleManager contractId={contract.id} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black tracking-tight uppercase text-muted-foreground/40">Gestão de Laudos</h2>
            {isAdmin && (
              <Link href={`/contracts/${contract.id}/reports/new`}>
                <Button size="sm" className="btn-premium">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Laudo
                </Button>
              </Link>
            )}
          </div>
          <ReportsKanban initialReports={contract.reports as any} isOwnerOrAdmin={isOwner || isAdmin} />
        </TabsContent>

        <TabsContent value="measurements" className="space-y-8 pt-4">
          {/* Dashboard com gráficos */}
          <SupervisorMeasurementsDashboard
            devices={contract.measurementDevices.map((d: any) => ({
              ...d,
              contract: {
                id: contract.id,
                name: contract.name,
                company: contract.company,
              }
            }))}
          />

          {/* Gerenciador de entrada de medições (apenas ADMIN) */}
          {isAdmin && (
            <div className="pt-8 border-t border-border/40">
              <MeasurementManager
                contractId={contract.id}
                devices={contract.measurementDevices as any}
                isAdmin={isAdmin}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="relevant-items" className="space-y-4 pt-4">
          <RelevantItemsKanban
            initialItems={contract.relevantItems as any}
            contractId={contract.id}
          />
        </TabsContent>

        {/* A aba chamados só é exibida para ADMIN e SUPERVISOR — técnicos acessam via /chamados */}
        {session.user.role !== "TECHNICIAN" && (
          <TabsContent value="chamados" className="space-y-4 pt-4">
            <ChamadosKanban
              contractId={contract.id}
              showNewButton={isAdmin || session.user.role === "SUPERVISOR"}
              role={session.user.role}
            />
          </TabsContent>
        )}

      </Tabs>
    </div>
  );
}
