import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Editar leitura
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { value, notes } = await req.json();

    // Buscar a leitura atual
    const entry = await prisma.measurementEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Atualizar com histórico
    const updated = await prisma.measurementEntry.update({
      where: { id },
      data: {
        previousValue: entry.value, // Salvar valor anterior
        value: parseFloat(value),
        notes: notes || entry.notes,
        editedBy: session.user.id,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    console.log(`[MEASUREMENT_EDIT] User ${session.user.name} edited entry ${id}: ${entry.value} -> ${value}`);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[MEASUREMENT_EDIT] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Deletar leitura (apenas admin)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.measurementEntry.delete({
      where: { id },
    });

    console.log(`[MEASUREMENT_DELETE] User ${session.user.name} deleted entry ${id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[MEASUREMENT_DELETE] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
