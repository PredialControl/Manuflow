/**
 * Utilitários de tradução de status para exibição em PT-BR
 */

export type ReportStatus = "APPROVED" | "PENDING_APPROVAL" | "PENDING" | "REJECTED" | "EXPIRED";

export const reportStatusLabel: Record<string, string> = {
  APPROVED: "Aprovado",
  PENDING_APPROVAL: "Aguardando",
  PENDING: "Pendente",
  REJECTED: "Reprovado",
  EXPIRED: "Vencido",
};

export const reportStatusClass: Record<string, string> = {
  APPROVED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  PENDING_APPROVAL:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  PENDING:
    "bg-muted text-muted-foreground",
  REJECTED:
    "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
  EXPIRED:
    "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
};

export function getStatusLabel(status: string): string {
  return reportStatusLabel[status] ?? status;
}

export function getStatusClass(status: string): string {
  return reportStatusClass[status] ?? "bg-muted text-muted-foreground";
}
