import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getContractWhereClause, isCompanyAdmin } from "@/lib/multi-tenancy";
import { ContractsClient } from "@/components/contracts-client";

export default async function ContractsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const whereClause = getContractWhereClause(session);

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
    <ContractsClient
      contracts={contracts}
      canCreate={isCompanyAdmin(session)}
    />
  );
}
