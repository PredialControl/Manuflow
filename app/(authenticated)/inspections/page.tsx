import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RondasHoje } from "@/components/rondas-hoje";

export default async function InspectionsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-foreground">
            Central de Rondas
          </h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Gestão e execução de atividades programadas
          </p>
        </div>
      </div>

      <RondasHoje />
    </div>
  );
}
