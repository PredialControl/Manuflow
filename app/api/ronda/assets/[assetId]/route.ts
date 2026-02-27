import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { assetId } = await params;

    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        active: true,
        deletedAt: null,
        includeInRonda: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        location: true,
        contractId: true,
        scripts: {
          select: {
            id: true,
            question: true,
            order: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!asset) {
      return NextResponse.json(
        { message: "Ativo não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Error fetching ronda asset:", error);
    return NextResponse.json(
      { message: "Erro ao buscar ativo" },
      { status: 500 }
    );
  }
}
