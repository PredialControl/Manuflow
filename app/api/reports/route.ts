import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyWhereClause } from "@/lib/multi-tenancy";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const whereClause = getCompanyWhereClause(session);

  const reports = await prisma.report.findMany({
    where: {
      ...whereClause,
      deletedAt: null,
    },
    include: {
      contract: { select: { id: true, name: true } },
      asset: { select: { id: true, name: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "TECHNICIAN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { 
    contractId, 
    assetId, 
    title, 
    executionDate, 
    expirationDate, 
    recurrence,
    technicalResponsible,
    crea,
    notes,
    recommendations
  } = body;

  if (!contractId || !title || !executionDate || !expirationDate || !technicalResponsible || !crea) {
    return NextResponse.json(
      { message: "Campos obrigatórios faltando" },
      { status: 400 }
    );
  }

  const report = await prisma.report.create({
    data: {
      contractId,
      companyId: session.user.companyId,
      assetId: assetId || null,
      userId: session.user.id,
      title,
      executionDate: new Date(executionDate),
      expirationDate: new Date(expirationDate),
      recurrence: recurrence || "MONTHLY",
      technicalResponsible,
      crea,
      notes: notes || null,
      recommendations: recommendations || null,
      status: "DRAFT",
    },
  });

  return NextResponse.json(report, { status: 201 });
}
