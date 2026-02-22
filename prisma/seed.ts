import { prisma } from "@/lib/prisma";
import { ReportCategory, Frequency } from "@prisma/client";
import bcrypt from "bcryptjs";

const defaultTemplates: Array<{
  name: string;
  category: ReportCategory;
  description: string;
  frequency: Frequency;
  isDefault: boolean;
  checklist: string[];
  requiredPhotos: string[];
}> = [
  {
    name: "SPDA - Sistema de Proteção contra Descargas Atmosféricas",
    category: "ELECTRICAL",
    description: "Laudo técnico de sistema SPDA conforme normas vigentes",
    frequency: "ANNUAL",
    isDefault: true,
    checklist: [
      "Verificar integridade do sistema de captação",
      "Inspecionar condicionadores de carga",
      "Verificar sistema de aterramento",
      "Medir resistência de aterramento",
      "Verificar conexões e terminais",
      "Inspecionar sistema de descida",
      "Verificar sinalização",
      "Elaborar relatório técnico",
    ],
    requiredPhotos: [
      "Foto geral da instalação",
      "Foto do sistema de captação",
      "Foto das hastes de aterramento",
      "Foto das conexões",
    ],
  },
  {
    name: "Sistema de Incêndio",
    category: "FIRE",
    description: "Laudo técnico de sistema de combate a incêndio",
    frequency: "ANNUAL",
    isDefault: true,
    checklist: [
      "Verificar extintores",
      "Inspecionar mangueiras",
      "Verificar sistema de sprinklers",
      "Inspecionar alarmes",
      "Verificar rotas de evacuação",
      "Inspecionar portas corta-fogo",
      "Verificar iluminação de emergência",
      "Elaborar relatório técnico",
    ],
    requiredPhotos: [
      "Foto dos extintores",
      "Foto da central de alarme",
      "Foto das mangueiras",
      "Foto da sinalização",
    ],
  },
  {
    name: "Caixa d'Água",
    category: "HYDRAULIC",
    description: "Laudo técnico de reservatório de água",
    frequency: "SEMIANNUAL",
    isDefault: true,
    checklist: [
      "Verificar estrutura da caixa d'água",
      "Inspecionar sistema de flotador",
      "Verificar registro de controle",
      "Inspecionar tubulações",
      "Verificar sistema de esgotamento",
      "Verificar limpeza e conservação",
      "Coletar água para análise",
      "Elaborar relatório técnico",
    ],
    requiredPhotos: [
      "Foto externa da caixa d'água",
      "Foto interna da caixa d'água",
      "Foto do sistema de flotador",
      "Foto das tubulações",
    ],
  },
  {
    name: "Gases Medicinais",
    category: "HOSPITAL",
    description: "Laudo técnico de sistema de gases medicinais",
    frequency: "MONTHLY",
    isDefault: true,
    checklist: [
      "Verificar central de gases",
      "Inspecionar válvulas",
      "Verificar pontos de consumo",
      "Testar alarmes",
      "Verificar sistema de alarme",
      "Inspecionar mangueiras e conexões",
      "Verificar identificação",
      "Elaborar relatório técnico",
    ],
    requiredPhotos: [
      "Foto da central de gases",
      "Foto das válvulas",
      "Foto dos pontos de consumo",
      "Foto da identificação",
    ],
  },
  {
    name: "Climatização Hospitalar",
    category: "HOSPITAL",
    description: "Laudo técnico de sistema de ar condicionado hospitalar",
    frequency: "MONTHLY",
    isDefault: true,
    checklist: [
      "Verificar unidades condensadoras",
      "Inspecionar unidades evaporadoras",
      "Verificar filtros",
      "Inspecionar dutos",
      "Verificar sistema de pressurização",
      "Testar temperatura e umidade",
      "Verificar manutenção preventiva",
      "Elaborar relatório técnico",
    ],
    requiredPhotos: [
      "Foto da unidade condensadora",
      "Foto da unidade evaporadora",
      "Foto dos filtros",
      "Foto do painel de controle",
    ],
  },
  {
    name: "Estrutural",
    category: "STRUCTURAL",
    description: "Laudo técnico de inspeção estrutural",
    frequency: "ANNUAL",
    isDefault: true,
    checklist: [
      "Verificar fundações",
      "Inspecionar estrutura de concreto",
      "Verificar estrutura metálica",
      "Inspecionar cobertura",
      "Verificar sistema de impermeabilização",
      "Inspecionar fissuras e trincas",
      "Verificar elementos de apoio",
      "Elaborar relatório técnico",
    ],
    requiredPhotos: [
      "Foto da fachada",
      "Foto da cobertura",
      "Foto de fissuras",
      "Foto das fundações",
    ],
  },
];

async function main() {
  console.log("Iniciando seed...");

  // Criar ou buscar empresa padrão
  const defaultCompany = await prisma.company.upsert({
    where: { id: "manuflow-default" },
    update: {},
    create: {
      id: "manuflow-default",
      name: "ManuFlow",
      subscriptionStatus: "ACTIVE",
    },
  });

  console.log("Empresa padrão criada:", defaultCompany.name);

  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@manuflow.com.br" },
    update: {},
    create: {
      email: "admin@manuflow.com.br",
      name: "Administrador",
      password: hashedPassword,
      role: "ADMIN",
      companyId: defaultCompany.id,
    },
  });

  console.log("Usuário admin criado:", admin.email);

  for (const template of defaultTemplates) {
    await prisma.reportTemplate.upsert({
      where: { id: template.name.toLowerCase().replace(/\s+/g, "-") },
      update: template,
      create: {
        ...template,
        id: template.name.toLowerCase().replace(/\s+/g, "-"),
      },
    });
  }

  console.log("Templates padrão criados");

  console.log("Seed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
