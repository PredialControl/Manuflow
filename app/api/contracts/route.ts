import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getContractWhereClause } from "@/lib/multi-tenancy";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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

  return NextResponse.json(contracts);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, company, responsible, email, phone, logo, companyId: targetCompanyId } = body;

  if (!name || !company || !responsible || !email) {
    return NextResponse.json(
      { message: "Campos obrigatórios faltando" },
      { status: 400 }
    );
  }

  // SUPER_ADMIN can create contracts for any company (must provide companyId)
  // ADMIN/OWNER creates contracts for their own company
  const companyId = session.user.role === "SUPER_ADMIN" && targetCompanyId
    ? targetCompanyId
    : session.user.companyId;

  const contract = await prisma.contract.create({
    data: {
      name,
      company,
      companyId,
      responsible,
      email,
      phone,
      logo,
    },
  });

  await prisma.userContract.create({
    data: {
      userId: session.user.id,
      contractId: contract.id,
    },
  });

  return NextResponse.json(contract, { status: 201 });
}
