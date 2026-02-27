import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getContractWhereClause } from "@/lib/multi-tenancy";

// Perguntas predefinidas por tipo de ativo de ronda
const RONDA_ASSET_QUESTIONS = {
  "Gerador": [
    "Gerador está aquecendo o óleo diesel?",
    "Existem vazamentos?",
    "Está no modo automático?",
    "Está ligado agora?",
    "Painel sem alarme?",
    "Local seco?",
    "Ventilação livre?"
  ],
  "Bomba de Esgoto": [
    "As duas bombas estão funcionando?",
    "As válvulas de retenção estão OK?",
    "As bóias estão atuando?",
    "O revezamento de bombas está sendo feito?",
    "O poço está vazio?",
    "Existe vazamento?",
    "Painel sem alarme?"
  ],
  "Bombas de Pressurização": [
    "As bombas estão funcionando?",
    "Existe vazamento?",
    "Pressão normal?",
    "O revezamento das bombas está ocorrendo?",
    "Painel sem alarme?"
  ],
  "Bombas de Recalque": [
    "As bombas estão funcionando?",
    "Existe vazamento?",
    "As bóias estão funcionando?",
    "O revezamento das bombas está ocorrendo?",
    "As válvulas de retenção estão atuando?",
    "Nível normal?",
    "Painel sem alarme?"
  ],
  "Bomba de Incêndio": [
    "Está em automático?",
    "Bomba jockey funcionando?",
    "Existe vazamento?",
    "Pressão normal?",
    "Painel sem alarme?",
    "Local seco?"
  ],
  "Cabine Primária": [
    "Existe energia da concessionária?",
    "Cabine limpa?",
    "Local seco?",
    "Sem cheiro de queimado?",
    "Equipamentos normais?"
  ],
  "Nobreak / Banco de Baterias": [
    "Nobreak ligado?",
    "Nobreak sem alarme?",
    "Existe energia da concessionária?",
    "Banco de baterias normal?",
    "Sem aquecimento?",
    "Local seco?"
  ],
  "Ressonância Magnética": [
    "Equipamento ligado?",
    "Sem alarmes?",
    "Nobreak ligado?",
    "Existe energia?",
    "Ar-condicionado funcionando?",
    "Temperatura normal?",
    "Sem vazamentos?",
    "Porta fechada?"
  ]
};

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const whereClause = getContractWhereClause(session);

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

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, company, responsible, email, phone, logo, companyId: targetCompanyId } = body;

  if (!name || !company || !responsible || !email) {
    return NextResponse.json(
      { message: "Campos obrigatórios faltando" },
      { status: 400 }
    );
  }

  // SUPER_ADMIN can create contracts for any company (must provide companyId)
  // ADMIN/OWNER creates contracts for their own company
  const companyId = session.user.role === "SUPER_ADMIN" && targetCompanyId
    ? targetCompanyId
    : session.user.companyId;

  const contract = await prisma.contract.create({
    data: {
      name,
      company,
      companyId,
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

  // Criar ativos de ronda automaticamente
  try {
    for (const [assetType, questions] of Object.entries(RONDA_ASSET_QUESTIONS)) {
      // Criar o ativo
      const asset = await prisma.asset.create({
        data: {
          name: assetType,
          type: assetType,
          location: "A definir",
          category: "GERAL",
          frequency: "DAILY",
          includeInRonda: true,
          contractId: contract.id,
          companyId: companyId,
        }
      });

      // Criar as perguntas (AssetScript)
      for (let i = 0; i < questions.length; i++) {
        await prisma.assetScript.create({
          data: {
            assetId: asset.id,
            companyId: companyId,
            order: i + 1,
            question: questions[i],
            required: true,
            requirePhoto: false,
          }
        });
      }
    }
  } catch (error) {
    console.error("Erro ao criar ativos de ronda:", error);
    // Continua mesmo se falhar a criação dos ativos
  }

  return NextResponse.json(contract, { status: 201 });
}
