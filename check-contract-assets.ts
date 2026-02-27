import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Buscar o último contrato criado
  const lastContract = await prisma.contract.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      assets: {
        where: {
          includeInRonda: true,
          active: true,
          deletedAt: null,
        },
        include: {
          scripts: true,
        }
      }
    }
  })

  if (!lastContract) {
    console.log('❌ Nenhum contrato encontrado')
    return
  }

  console.log('\n📋 Último Contrato Criado:')
  console.log(`   ID: ${lastContract.id}`)
  console.log(`   Nome: ${lastContract.name}`)
  console.log(`   Criado em: ${lastContract.createdAt}`)
  console.log(`   CompanyId: ${lastContract.companyId}`)
  console.log(`\n🔍 Ativos de Ronda:`)
  console.log(`   Total: ${lastContract.assets.length}`)

  if (lastContract.assets.length === 0) {
    console.log('\n⚠️  PROBLEMA: Nenhum ativo de ronda foi criado!')
    console.log('\n🔧 Criando ativos agora...')

    // Tentar criar os ativos manualmente
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
    }

    for (const [assetType, questions] of Object.entries(RONDA_ASSET_QUESTIONS)) {
      console.log(`   ✓ Criando: ${assetType}`)

      const asset = await prisma.asset.create({
        data: {
          name: assetType,
          type: assetType,
          location: "A definir",
          category: "GERAL",
          frequency: "DAILY",
          includeInRonda: true,
          contractId: lastContract.id,
          companyId: lastContract.companyId,
        }
      })

      for (let i = 0; i < questions.length; i++) {
        await prisma.assetScript.create({
          data: {
            assetId: asset.id,
            companyId: lastContract.companyId,
            order: i + 1,
            question: questions[i],
            required: true,
            requirePhoto: false,
          }
        })
      }
    }

    console.log('\n✅ 8 ativos criados com sucesso!')
  } else {
    lastContract.assets.forEach(asset => {
      console.log(`\n   📦 ${asset.name}`)
      console.log(`      - ${asset.scripts.length} perguntas`)
      console.log(`      - Location: ${asset.location}`)
    })
  }
}

main()
  .catch((error) => {
    console.error('❌ Erro:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
