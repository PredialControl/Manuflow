import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
      contracts: {
        select: {
          id: true,
          name: true,
          company: true,
          active: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          users: true,
          contracts: true,
          assets: true,
          reports: true,
        },
      },
    },
  });

  if (!company) {
    return NextResponse.json({ message: "Empresa não encontrada" }, { status: 404 });
  }

  return NextResponse.json(company);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, logo, subscriptionStatus, expirationDate, settings } = body;

  const company = await prisma.company.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(logo !== undefined && { logo }),
      ...(subscriptionStatus && { subscriptionStatus }),
      ...(expirationDate !== undefined && {
        expirationDate: expirationDate ? new Date(expirationDate) : null,
      }),
      ...(settings !== undefined && { settings }),
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

  return NextResponse.json(company);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verificar se há dados associados
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          contracts: true,
        },
      },
    },
  });

  if (!company) {
    return NextResponse.json({ message: "Empresa não encontrada" }, { status: 404 });
  }

  if (company._count.users > 0 || company._count.contracts > 0) {
    return NextResponse.json(
      {
        message:
          "Não é possível excluir empresa com usuários ou contratos associados",
      },
      { status: 400 }
    );
  }

  await prisma.company.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Empresa excluída com sucesso" });
}
