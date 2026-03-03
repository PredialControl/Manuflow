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

    // Construir filtro de categoria corretamente
    const categoryFilter = userCategory
      ? {
          OR: [
            { category: userCategory }, // Ativos da categoria do técnico
            { category: "GERAL" },      // Ativos gerais (todos veem)
            { category: null },         // Ativos sem categoria (todos veem)
          ],
        }
      : {};

    // Buscar ativos que estão marcados para incluir na ronda
    const assets = await prisma.asset.findMany({
      where: {
        active: true,
        deletedAt: null,
        includeInRonda: true,
        frequency: "DAILY", // Apenas ativos com vistoria diária
        ...categoryFilter,
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

    // Buscar contratos do técnico para pegar os hidrômetros/medidores
    const contracts = await prisma.contract.findMany({
      where: contractWhereClause,
      select: { id: true },
    });

    const contractIds = contracts.map((c) => c.id);

    // Buscar hidrômetros/medidores ativos
    const devices = await prisma.measurementDevice.findMany({
      where: {
        contractId: { in: contractIds },
        active: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        unit: true,
        serialNumber: true,
        contract: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Combinar ativos e hidrômetros em uma única lista
    const allItems = [
      ...assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        type: asset.type,
        location: asset.location || "Sem localização",
        image: asset.image,
        itemType: "ASSET" as const,
        _count: asset._count,
      })),
      ...devices.map((device) => ({
        id: device.id,
        name: device.name,
        type: `Medidor ${device.type === "WATER" ? "Água" : device.type === "ENERGY" ? "Energia" : "Gás"}`,
        location: device.contract.name,
        image: null,
        itemType: "DEVICE" as const,
        _count: { scripts: 0 }, // Medidores não têm scripts, só leitura
        unit: device.unit,
        serialNumber: device.serialNumber,
      })),
    ];

    // Ordenar por nome
    allItems.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(allItems);
  } catch (error) {
    console.error("Error fetching ronda assets:", error);
    return NextResponse.json(
      { message: "Erro ao buscar ativos", error: String(error) },
      { status: 500 }
    );
  }
}
