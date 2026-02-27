import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Simular o código do endpoint POST /api/contracts
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

async function testContractCreation() {
  console.log('\n🧪 TESTE: Criação de Contrato com Ativos\n')

  // Buscar uma empresa existente
  const company = await prisma.company.findFirst()

  if (!company) {
    console.log('❌ Nenhuma empresa encontrada no banco')
    return
  }

  console.log(`✓ Empresa encontrada: ${company.name} (${company.id})`)

  // Criar contrato de teste
  console.log('\n📝 Criando contrato de teste...')
  const contract = await prisma.contract.create({
    data: {
      name: "TESTE AUTO-CRIAÇÃO",
      company: "Empresa Teste",
      companyId: company.id,
      responsible: "Teste",
      email: "teste@teste.com",
      phone: "1234567890",
    },
  })

  console.log(`✓ Contrato criado: ${contract.id}`)

  // Criar ativos (novo código otimizado)
  console.log('\n🔧 Criando ativos de ronda...')

  const startTime = Date.now()

  const assetCreationPromises = Object.entries(RONDA_ASSET_QUESTIONS).map(async ([assetType, questions]) => {
    try {
      const asset = await prisma.asset.create({
        data: {
          name: assetType,
          type: assetType,
          location: "A definir",
          category: "GERAL",
          frequency: "DAILY",
          includeInRonda: true,
          contractId: contract.id,
          companyId: company.id,
        }
      })

      const scriptPromises = questions.map((question, index) =>
        prisma.assetScript.create({
          data: {
            assetId: asset.id,
            companyId: company.id,
            order: index + 1,
            question: question,
            required: true,
            requirePhoto: false,
          }
        })
      )

      await Promise.all(scriptPromises)
      console.log(`   ✓ ${assetType} (${questions.length} perguntas)`)
    } catch (error) {
      console.error(`   ✗ Erro ao criar ${assetType}:`, error)
    }
  })

  await Promise.all(assetCreationPromises)

  const endTime = Date.now()

  console.log(`\n✅ Teste concluído em ${endTime - startTime}ms`)

  // Verificar resultado
  const createdAssets = await prisma.asset.count({
    where: {
      contractId: contract.id,
      includeInRonda: true,
    }
  })

  console.log(`\n📊 Resultado: ${createdAssets} ativos criados`)

  if (createdAssets === 8) {
    console.log('🎉 SUCESSO! Todos os 8 ativos foram criados corretamente.')
  } else {
    console.log(`⚠️  PROBLEMA: Esperado 8 ativos, mas foram criados ${createdAssets}`)
  }

  // Limpar teste
  console.log('\n🗑️  Removendo contrato de teste...')
  await prisma.contract.delete({
    where: { id: contract.id }
  })
  console.log('✓ Teste limpo')
}

testContractCreation()
  .catch((error) => {
    console.error('\n❌ Erro no teste:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
