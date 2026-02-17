import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const assets = await prisma.asset.findMany({
    where: {
      contractId: params.id,
      active: true,
      deletedAt: null,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(assets);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, type, location, frequency, checklist, image, brand, model, power, category } = body;

  if (!name || !type || !location) {
    return NextResponse.json(
      { message: "Campos obrigatórios faltando" },
      { status: 400 }
    );
  }

  const asset = await prisma.asset.create({
    data: {
      contractId: params.id,
      name,
      type,
      location,
      brand,
      model,
      power,
      category,
      image,
      frequency: frequency || "MONTHLY",
    },
  });

  if (checklist && Array.isArray(checklist)) {
    for (let i = 0; i < checklist.length; i++) {
      await prisma.assetScript.create({
        data: {
          assetId: asset.id,
          order: i + 1,
          question: checklist[i],
          required: true,
          requirePhoto: i === 0,
        },
      });
    }
  }

  return NextResponse.json(asset, { status: 201 });
}
