import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StepStatus } from "@prisma/client";

interface QuestionAnswer {
  scriptId: string;
  question: string;
  answer: "SIM" | "NAO";
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { assetId, photo, answers } = body as {
      assetId: string;
      photo: string;
      answers: QuestionAnswer[];
    };

    // Buscar o ativo para pegar contractId e companyId
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        contractId: true,
        companyId: true,
      },
    });

    if (!asset) {
      return NextResponse.json(
        { message: "Ativo não encontrado" },
        { status: 404 }
      );
    }

    // Criar a inspeção
    const inspection = await prisma.inspection.create({
      data: {
        contractId: asset.contractId,
        companyId: asset.companyId,
        assetId: asset.id,
        userId: session.user.id,
        status: "COMPLETED",
        completedAt: new Date(),
        notes: "Ronda técnica realizada via app mobile",
      },
    });

    // Criar os passos (perguntas respondidas)
    const stepPromises = answers.map((answer, index) => {
      // Determinar o status baseado na resposta
      // SIM = OK, NÃO = WARNING (pode ser ajustado conforme necessidade)
      const status: StepStatus = answer.answer === "SIM" ? "OK" : "WARNING";

      return prisma.inspectionStep.create({
        data: {
          inspectionId: inspection.id,
          companyId: asset.companyId,
          scriptId: answer.scriptId,
          question: answer.question,
          status: status,
          notes: `Resposta: ${answer.answer}`,
          completedAt: new Date(),
          // A foto vai na primeira pergunta (foto do ativo)
          photoUrl: index === 0 ? photo : undefined,
        },
      });
    });

    await Promise.all(stepPromises);

    return NextResponse.json({
      message: "Ronda salva com sucesso",
      inspectionId: inspection.id,
    });
  } catch (error) {
    console.error("Error saving ronda:", error);
    return NextResponse.json(
      { message: "Erro ao salvar ronda" },
      { status: 500 }
    );
  }
}
