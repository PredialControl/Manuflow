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

  try {
    const contractWhereClause = getContractWhereClause(session);
    const userCategory = (session.user as any).category;

    // Buscar ativos que estão marcados para incluir na ronda
    const assets = await prisma.asset.findMany({
      where: {
        active: true,
        deletedAt: null,
        includeInRonda: true,
        frequency: "DAILY", // Apenas ativos com vistoria diária
        // Filtrar por categoria: técnico vê GERAL + sua categoria específica
        ...(userCategory ? {
          OR: [
            { category: userCategory }, // Ativos da categoria do técnico
            { category: "GERAL" },      // Ativos gerais (todos veem)
            { category: null },          // Ativos sem categoria (todos veem)
          ]
        } : {}),
        contract: {
          ...contractWhereClause,
          active: true,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        location: true,
        image: true,
        _count: {
          select: {
            scripts: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error("Error fetching ronda assets:", error);
    return NextResponse.json(
      { message: "Erro ao buscar ativos" },
      { status: 500 }
    );
  }
}
