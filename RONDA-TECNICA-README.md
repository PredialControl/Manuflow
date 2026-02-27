# 🔧 Sistema de Ronda Técnica - ManuFlow

Sistema completo de checklist mobile para técnicos realizarem rondas em ativos predefinidos.

## 📋 Funcionalidades Implementadas

### ✅ 8 Tipos de Ativos Predefinidos

1. **Gerador** (7 perguntas)
2. **Bomba de Esgoto** (7 perguntas)
3. **Bombas de Pressurização** (5 perguntas)
4. **Bombas de Recalque** (7 perguntas)
5. **Bomba de Incêndio** (6 perguntas)
6. **Cabine Primária** (5 perguntas)
7. **Nobreak / Banco de Baterias** (6 perguntas)
8. **Ressonância Magnética** (8 perguntas)

### ✅ Fluxo Completo

1. **📸 Foto Obrigatória**
   - Câmera do celular abre automaticamente
   - Foto deve ser tirada antes de continuar
   - Sem foto = não pode avançar
   - Foto fica visível no topo durante todo o checklist

2. **❓ Perguntas**
   - Uma pergunta por vez em tela cheia
   - Botões grandes: **SIM** (verde) e **NÃO** (vermelho)
   - Avanço automático ao clicar
   - Barra de progresso visual
   - Sem confirmações ou botões extras

3. **✅ Finalização**
   - Tela de "CHECKLIST FINALIZADO"
   - Opções: Nova Ronda ou Voltar ao Dashboard
   - Dados salvos automaticamente no banco

### ✅ Interface Mobile-First

- Layout otimizado para celular
- Letras grandes e legíveis
- Botões enormes e fáceis de clicar
- Navegação simples e intuitiva
- Perfeito para uso em campo

---

## 🚀 Como Usar

### ✨ Criação Automática de Ativos

**Os 8 ativos de ronda são criados AUTOMATICAMENTE quando você cria um novo contrato!**

Não precisa fazer nada - os ativos já nascem prontos para uso:
- ✅ 8 ativos com `includeInRonda = true`
- ✅ Todas as perguntas específicas de cada ativo
- ✅ Tudo configurado e pronto para o técnico usar

**Você pode excluir os ativos que não precisar** através da interface normal de ativos.

---

### Passo 1 (Opcional): Popular Ativos em Contratos Antigos

Se você tem contratos criados ANTES desta atualização, use o script:

```bash
npx tsx seed-ronda-assets.ts <ID_DO_CONTRATO>
```

**Exemplo:**
```bash
npx tsx seed-ronda-assets.ts cmlr63opz0000123lk1d4gcl4
```

### Passo 2: Acessar como Técnico

1. Faça login com uma conta **TECHNICIAN**
2. No menu lateral, clique em **"Ronda Técnica"**
3. Selecione o equipamento desejado
4. Siga o fluxo:
   - Tire a foto do equipamento
   - Responda as perguntas (SIM/NÃO)
   - Finalize o checklist

### Passo 3: Ver Resultados

Os resultados são salvos como **Inspeções** no banco de dados:

- Cada ronda cria uma `Inspection` com status `COMPLETED`
- Cada resposta cria um `InspectionStep` com:
  - **SIM** → Status `OK`
  - **NÃO** → Status `WARNING`
- A foto fica salva no primeiro `InspectionStep`

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

```
📂 ManuFlow/
├── seed-ronda-assets.ts                          # Script para popular ativos
├── app/(authenticated)/ronda/
│   ├── page.tsx                                  # Seleção de ativos
│   └── [assetId]/page.tsx                        # Execução da ronda
└── app/api/ronda/
    ├── route.ts                                  # POST - Salvar ronda
    └── assets/
        ├── route.ts                              # GET - Listar ativos
        └── [assetId]/route.ts                    # GET - Buscar ativo específico
```

### Arquivos Modificados

```
📝 components/authenticated-layout-client.tsx     # Adicionado link "Ronda Técnica"
📝 middleware.ts                                  # Permitido acesso /ronda para técnicos
```

---

## 🗂️ Estrutura do Banco de Dados

### Modelo `Asset`
```prisma
- includeInRonda: Boolean  // true para ativos de ronda
```

### Modelo `AssetScript`
```prisma
- question: String         // Pergunta do checklist
- order: Int              // Ordem de exibição
```

### Modelo `Inspection`
```prisma
- status: "COMPLETED"     // Ronda finalizada
- notes: "Ronda técnica realizada via app mobile"
```

### Modelo `InspectionStep`
```prisma
- status: "OK" | "WARNING"  // SIM = OK, NÃO = WARNING
- photoUrl: String?         // Foto apenas no primeiro step
- notes: "Resposta: SIM/NAO"
```

---

## 🎨 Design da Interface

### Cores
- **SIM**: Verde (`bg-green-500`)
- **NÃO**: Vermelho (`bg-red-500`)
- **Header**: Azul primário (`bg-primary`)
- **Conclusão**: Verde com ícone de check

### Tipografia
- **Títulos**: Font black, uppercase, tracking tight
- **Perguntas**: Texto 4xl, ultra legível
- **Botões**: Texto 3xl, maiúsculas, bold

### Componentes
- Cards com bordas arredondadas (rounded-2xl)
- Sombras profundas para destaque
- Animações suaves de transição
- Feedback visual imediato

---

## 🔐 Controle de Acesso

### TECHNICIAN
- ✅ Ver lista de ativos de ronda
- ✅ Executar rondas
- ✅ Tirar fotos e responder perguntas
- ✅ Acesso via `/ronda`

### ADMIN / OWNER
- ✅ Todos os acessos do técnico
- ✅ Criar/editar ativos
- ✅ Configurar perguntas

### SUPER_ADMIN
- ✅ Acesso total ao sistema

---

## 📱 Requisitos

### Navegador
- Câmera acessível via `navigator.mediaDevices.getUserMedia()`
- Suporte a Canvas API
- JavaScript habilitado

### Permissões
- **Câmera**: Necessária para tirar foto do equipamento
- **Armazenamento**: Para salvar fotos em Base64

### Compatibilidade
- ✅ Android (Chrome, Firefox)
- ✅ iOS (Safari 11+)
- ✅ Desktop (para testes)

---

## 🧪 Testando o Sistema

### 1. Criar um Contrato de Teste
```bash
# Via interface ou diretamente no banco
```

### 2. Popular os Ativos
```bash
npx tsx seed-ronda-assets.ts <CONTRACT_ID>
```

### 3. Criar um Usuário Técnico
```sql
-- Via interface ou script promote-owner.ts modificado
UPDATE "User" SET role = 'TECHNICIAN' WHERE email = 'tecnico@teste.com';
```

### 4. Fazer Login e Testar
1. Login como técnico
2. Ir para "Ronda Técnica"
3. Selecionar "Gerador"
4. Tirar foto
5. Responder as 7 perguntas
6. Ver tela de conclusão

### 5. Verificar Resultados
```sql
-- Ver inspeções criadas
SELECT * FROM "Inspection" WHERE "userId" = '<USER_ID>' ORDER BY "createdAt" DESC;

-- Ver passos/respostas
SELECT * FROM "InspectionStep" WHERE "inspectionId" = '<INSPECTION_ID>';
```

---

## 🎯 Próximos Passos (Opcional)

### Melhorias Futuras
- [ ] Histórico de rondas por ativo
- [ ] Dashboard de estatísticas (% SIM/NÃO)
- [ ] Notificações de rondas pendentes
- [ ] Modo offline (PWA)
- [ ] Assinatura digital do técnico
- [ ] Exportação para PDF
- [ ] Agendamento automático de rondas

### Personalização
- [ ] Permitir admin criar perguntas customizadas
- [ ] Configurar status críticos (NÃO = CRITICAL)
- [ ] Campos de observação opcionais
- [ ] Múltiplas fotos por ativo

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verificar logs do console do navegador
2. Verificar permissões de câmera
3. Testar em navegador diferente
4. Verificar se os ativos foram criados corretamente
5. Confirmar que o usuário tem role TECHNICIAN

---

## ✅ Checklist de Implementação

- [x] Script de população de ativos
- [x] Página de seleção de ativos
- [x] Página de execução de ronda
- [x] Captura de foto obrigatória
- [x] Fluxo de perguntas SIM/NÃO
- [x] Salvamento no banco de dados
- [x] API endpoints completos
- [x] Navegação para técnicos
- [x] Middleware configurado
- [x] Interface mobile-first
- [x] Documentação completa

**Status: ✅ 100% COMPLETO E PRONTO PARA USO!**
