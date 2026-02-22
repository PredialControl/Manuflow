import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: {
          users: true,
          contracts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(companies);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, logo, subscriptionStatus, expirationDate, settings } = body;

  if (!name) {
    return NextResponse.json(
      { message: "Nome é obrigatório" },
      { status: 400 }
    );
  }

  const company = await prisma.company.create({
    data: {
      name,
      logo: logo || null,
      subscriptionStatus: subscriptionStatus || "TRIAL",
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      settings: settings || null,
    },
    include: {
      _count: {
        select: {
          users: true,
          contracts: true,
        },
      },
    },
  });

  return NextResponse.json(company, { status: 201 });
}
