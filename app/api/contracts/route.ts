import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const whereClause = (session.user.role === "ADMIN" || session.user.role === "OWNER")
    ? {}
    : {
      users: {
        some: { userId: session.user.id }
      }
    };

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

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, company, responsible, email, phone, logo } = body;

  if (!name || !company || !responsible || !email) {
    return NextResponse.json(
      { message: "Campos obrigatórios faltando" },
      { status: 400 }
    );
  }

  const contract = await prisma.contract.create({
    data: {
      name,
      company,
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
