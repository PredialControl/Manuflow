import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Perguntas predefinidas por tipo de ativo
const ASSET_QUESTIONS = {
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
}

async function main() {
  const contractId = process.argv[2]

  if (!contractId) {
    console.error('❌ Por favor, forneça o ID do contrato')
    console.log('Uso: npx tsx seed-ronda-assets.ts <contractId>')
    process.exit(1)
  }

  // Verificar se o contrato existe
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { id: true, name: true, companyId: true }
  })

  if (!contract) {
    console.error(`❌ Contrato ${contractId} não encontrado`)
    process.exit(1)
  }

  console.log(`\n✅ Criando ativos de ronda para: ${contract.name}\n`)

  for (const [assetType, questions] of Object.entries(ASSET_QUESTIONS)) {
    console.log(`📦 Criando: ${assetType}...`)

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
        companyId: contract.companyId,
      }
    })

    // Criar as perguntas (AssetScript)
    for (let i = 0; i < questions.length; i++) {
      await prisma.assetScript.create({
        data: {
          assetId: asset.id,
          companyId: contract.companyId,
          order: i + 1,
          question: questions[i],
          required: true,
          requirePhoto: false, // Apenas a primeira foto do ativo é obrigatória
        }
      })
    }

    console.log(`   ✓ ${questions.length} perguntas criadas`)
  }

  console.log(`\n🎉 Sucesso! ${Object.keys(ASSET_QUESTIONS).length} ativos criados com suas perguntas.\n`)
}

main()
  .catch((error) => {
    console.error('❌ Erro:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
