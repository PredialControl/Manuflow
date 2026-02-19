import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Building2, FileText, ClipboardCheck, History, Settings, Package, MapPin, Users, User, UserPlus, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ReportsKanban } from "@/components/reports-kanban";
import { ContractUserActions } from "@/components/contract-user-actions";
import { ScheduleManager } from "@/components/schedule-manager";
import { DeleteAssetButton } from "@/components/delete-asset-button";

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

  const contract = await prisma.contract.findFirst({
    where: {
      id: params.id,
      active: true,
      deletedAt: null,
      ...(session.user.role !== "OWNER" && session.user.role !== "ADMIN"
        ? { users: { some: { userId: session.user.id } } }
        : {}),
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
            } as any
          }
        }
      }
    } as any,
  }) as any;

  if (!contract) {
    redirect("/contracts");
  }

  const isOwner = session.user.role === "OWNER";
  const isAdmin = session.user.role === "ADMIN" || isOwner;

  const reportStats = await prisma.report.groupBy({
    by: ["status"],
    where: {
      contractId: contract.id,
      deletedAt: null,
    },
    _count: true,
  });

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
        {session.user.role === "ADMIN" && (
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
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="overview" asChild className="rounded-lg font-bold data-[state=active]:bg-background">
            <Link href={`/contracts/${contract.id}`}>Overview</Link>
          </TabsTrigger>
          <TabsTrigger value="assets" asChild className="rounded-lg font-bold data-[state=active]:bg-background">
            <Link href={`/contracts/${contract.id}?tab=assets`}>Ativos</Link>
          </TabsTrigger>
          <TabsTrigger value="inspections" asChild className="rounded-lg font-bold data-[state=active]:bg-background">
            <Link href={`/contracts/${contract.id}?tab=inspections`}>Rondas</Link>
          </TabsTrigger>
          <TabsTrigger value="reports" asChild className="rounded-lg font-bold data-[state=active]:bg-background">
            <Link href={`/contracts/${contract.id}?tab=reports`}>Laudos</Link>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="team" asChild className="rounded-lg font-bold data-[state=active]:bg-background">
              <Link href={`/contracts/${contract.id}?tab=team`}>Equipe</Link>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contract.assets.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Laudos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contract.reports.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conformidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">100%</div>
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
                          className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${report.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : report.status === "PENDING_APPROVAL"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {report.status}
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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black tracking-tight uppercase text-muted-foreground/40 italic">Ativos do Contrato</h2>
            {session.user.role === "ADMIN" && (
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
                {session.user.role === "ADMIN" && (
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-4">
              {contract.assets.map((asset: any) => (
                <div key={asset.id} className="relative group/asset">
                  {isAdmin && (
                    <div className="absolute top-4 right-4 z-10 opacity-0 group-hover/asset:opacity-100 transition-opacity">
                      <DeleteAssetButton
                        assetId={asset.id}
                        contractId={contract.id}
                        assetName={asset.name}
                        variant="icon"
                      />
                    </div>
                  )}
                  <Link href={`/contracts/${contract.id}/assets/${asset.id}`}>
                    <Card className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer overflow-hidden border-border/60 hover:border-primary/40 rounded-2xl bg-card/40 backdrop-blur-sm h-full">
                      <div className="aspect-[16/10] w-full bg-muted overflow-hidden relative border-b border-border/40">
                        {asset.image ? (
                          <img src={asset.image} alt={asset.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 bg-muted/50">
                            <Package className="h-12 w-12 mb-2 opacity-20" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Sem Imagem</span>
                          </div>
                        )}

                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          <span className="bg-background/80 backdrop-blur-md text-[10px] font-black px-3 py-1.5 rounded-lg border border-border/40 uppercase tracking-widest shadow-sm">
                            {asset.type}
                          </span>
                          {asset.category && (
                            <span className="bg-primary/10 backdrop-blur-md text-primary text-[8px] font-black px-2 py-1 rounded-md border border-primary/20 uppercase tracking-widest shadow-sm">
                              {asset.category.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-black tracking-tight uppercase italic leading-tight group-hover:text-primary transition-colors">{asset.name}</h3>
                            <div className="flex items-center gap-2 mt-1.5">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{asset.location}</p>
                            </div>
                            {(asset.brand || asset.power) && (
                              <div className="flex items-center gap-2 mt-2">
                                {asset.brand && (
                                  <span className="text-[9px] font-black bg-primary/5 text-primary px-2 py-0.5 rounded-md border border-primary/10 uppercase tracking-tighter">
                                    {asset.brand}
                                  </span>
                                )}
                                {asset.power && (
                                  <span className="text-[9px] font-black bg-muted text-muted-foreground px-2 py-0.5 rounded-md border border-border/40 uppercase tracking-tighter">
                                    {asset.power}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-tighter">Frequência</span>
                              <span className="text-xs font-black uppercase tracking-widest">{asset.frequency}</span>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                              <Plus className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase text-muted-foreground/40 italic">Equipe Responsável</h2>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Colaboradores alocados neste contrato</p>
            </div>
            {isAdmin && (
              <Link href={`/contracts/${contract.id}/users/new`}>
                <Button size="sm" className="btn-premium">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Colaborador
                </Button>
              </Link>
            )}
          </div>

          <div className="grid gap-4">
            {contract.users.length === 0 ? (
              <Card className="border-dashed border-border/40 bg-muted/10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/20 mb-4" />
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Nenhum colaborador alocado</p>
                </CardContent>
              </Card>
            ) : (
              contract.users.map((uc: any) => (
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
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{uc.user.role}</span>
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
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-4">
          <ScheduleManager contractId={contract.id} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black tracking-tight uppercase text-muted-foreground/40">Gestão de Laudos</h2>
            {(session.user.role === "ADMIN" || session.user.role === "OWNER") && (
              <Link href={`/contracts/${contract.id}/reports/new`}>
                <Button size="sm" className="btn-premium">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Laudo
                </Button>
              </Link>
            )}
          </div>
          <ReportsKanban initialReports={contract.reports as any} />
        </TabsContent>

      </Tabs>
    </div>
  );
}
