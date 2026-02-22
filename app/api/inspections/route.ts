import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyWhereClause } from "@/lib/multi-tenancy";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { contractId, assetId } = body;

  if (!contractId || !assetId) {
    return NextResponse.json(
      { message: "Contract and asset are required" },
      { status: 400 }
    );
  }

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, contractId },
    include: { scripts: { orderBy: { order: "asc" } } },
  });

  if (!asset) {
    return NextResponse.json({ message: "Asset not found" }, { status: 404 });
  }

  const inspection = await prisma.inspection.create({
    data: {
      companyId: session.user.companyId,
      contractId,
      assetId,
      userId: session.user.id,
      status: "IN_PROGRESS",
    },
  });

  const steps = await Promise.all(
    asset.scripts.map((script: any) =>
      prisma.inspectionStep.create({
        data: {
          companyId: session.user.companyId,
          inspectionId: inspection.id,
          scriptId: script.id,
          question: script.question,
          requirePhoto: script.requirePhoto,
          status: "PENDING",
        },
      })
    )
  );

  if (steps.length === 0) {
    const defaultSteps = [
      "Verificar condição geral",
      "Verificar funcionamento",
      "Verificar manutenção",
      "Registrar observações",
    ];

    for (let i = 0; i < defaultSteps.length; i++) {
      await prisma.inspectionStep.create({
        data: {
          companyId: session.user.companyId,
          inspectionId: inspection.id,
          question: defaultSteps[i],
          requirePhoto: i === 0,
          status: "PENDING",
        },
      });
    }
  }

  const updatedInspection = await prisma.inspection.findUnique({
    where: { id: inspection.id },
    include: { steps: true },
  });

  return NextResponse.json({
    inspection,
    steps: updatedInspection?.steps || [],
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const whereClause = getCompanyWhereClause(session);

  const inspections = await prisma.inspection.findMany({
    where: whereClause,
    include: {
      contract: { select: { name: true } },
      asset: { select: { name: true } },
      user: { select: { name: true } },
      steps: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(inspections);
}
