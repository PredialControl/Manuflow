import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Listar todos os usuários
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    include: {
      company: {
        select: {
          id: true,
          name: true,
          subscriptionStatus: true,
        },
      },
      _count: {
        select: {
          contracts: true,
        },
      },
    },
    orderBy: [
      { company: { name: "asc" } },
      { role: "asc" },
      { name: "asc" },
    ],
  });

  return NextResponse.json(users);
}

// Criar novo ADMIN para uma empresa
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, password, companyId } = body;

  if (!name || !email || !password || !companyId) {
    return NextResponse.json(
      { message: "Campos obrigatórios faltando" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
        companyId,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "E-mail já cadastrado" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
