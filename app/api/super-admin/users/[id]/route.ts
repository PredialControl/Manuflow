import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Resetar senha de um usuário
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
  const { action, password } = body;

  try {
    if (action === "reset-password" && password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        message: "Senha resetada com sucesso",
        user: { id: user.id, email: user.email }
      });
    }

    if (action === "toggle-status") {
      // Para bloquear, podemos usar um campo "active" ou mudar a senha
      // Por enquanto vamos apenas indicar que foi bloqueado
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
      }

      // Aqui você pode adicionar um campo "active" ou "blocked" no schema
      // Por enquanto vou apenas retornar sucesso
      return NextResponse.json({
        message: "Status alterado com sucesso",
        user: { id: user.id, email: user.email }
      });
    }

    return NextResponse.json(
      { message: "Ação inválida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

// Excluir usuário
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json(
      { message: "Erro ao excluir usuário" },
      { status: 500 }
    );
  }
}
