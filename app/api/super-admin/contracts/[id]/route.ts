import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const { paymentStatus, paymentDueDate, monthlyValue } = body;

  try {
    const updates: any = {};

    if (paymentStatus) {
      updates.paymentStatus = paymentStatus;
    }

    if (paymentDueDate !== undefined) {
      updates.paymentDueDate = paymentDueDate ? new Date(paymentDueDate) : null;
    }

    if (monthlyValue !== undefined) {
      updates.monthlyValue = monthlyValue ? parseFloat(monthlyValue) : null;
    }

    const contract = await prisma.contract.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({
      message: "Contrato atualizado com sucesso",
      contract,
    });
  } catch (error) {
    console.error("Erro ao atualizar contrato:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar contrato" },
      { status: 500 }
    );
  }
}
