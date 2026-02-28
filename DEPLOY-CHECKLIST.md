# 📋 Checklist de Deploy Seguro - ManuFlow

## ⚠️ REGRA DE OURO: NUNCA PERCA DADOS DE CLIENTES

Este checklist garante que **NENHUM DADO seja perdido** durante deploys e atualizações.

---

## 🔴 ANTES DE QUALQUER ALTERAÇÃO NO BANCO

### 1. Fazer Backup Obrigatório
```bash
# Execute SEMPRE antes de alterações no banco
node scripts/backup-db.js
```

**✅ Checklist:**
- [ ] Backup criado com sucesso
- [ ] Arquivo de backup salvo em `/backups`
- [ ] Tamanho do backup verificado (não está vazio)

---

## 🟡 ALTERAÇÕES NO SCHEMA DO BANCO

### Opção A: Ambiente de Desenvolvimento (Testando)
```bash
# Apenas em DEV - NUNCA em produção
npx prisma db push
```

### Opção B: Produção (Com Clientes)
```bash
# 1. Criar migration (em DEV)
npx prisma migrate dev --name descricao_da_mudanca

# 2. Testar migration em staging

# 3. Aplicar em produção (SEGURO - não perde dados)
npx prisma migrate deploy
```

**✅ Checklist:**
- [ ] Migration testada em ambiente de desenvolvimento
- [ ] Migration testada em staging (se disponível)
- [ ] Backup feito antes do deploy
- [ ] Migration aplicada em produção com `migrate deploy`
- [ ] Validação pós-deploy (dados ainda existem)

---

## 🟢 COMANDOS SEGUROS vs PERIGOSOS

### ✅ SEGUROS (Pode usar em produção):
```bash
npx prisma migrate deploy          # Aplica migrations SEM perder dados
npx prisma db push                 # Atualiza schema SEM reset
npx prisma studio                  # Visualizar dados
node scripts/backup-db.js          # Fazer backup
```

### ❌ PERIGOSOS (BLOQUEADOS em produção):
```bash
npx prisma db push --force-reset   # ❌ APAGA TUDO
npx prisma db push --accept-data-loss  # ❌ PODE PERDER DADOS
npx prisma migrate reset           # ❌ RESETA BANCO
```

---

## 📊 PROCESSO DE DEPLOY COMPLETO

### Passo 1: Preparação (Local)
```bash
# 1. Testar todas as mudanças localmente
npm run dev

# 2. Criar migration se houver mudança no schema
npx prisma migrate dev --name nome_da_mudanca

# 3. Testar migration
npm run build
```

### Passo 2: Backup (OBRIGATÓRIO)
```bash
# Fazer backup do banco de produção
node scripts/backup-db.js
```

### Passo 3: Deploy
```bash
# 1. Commit e push
git add .
git commit -m "Descrição clara das mudanças"
git push

# 2. Deploy automático via Vercel
# Vercel vai executar automaticamente:
# - npm install
# - npx prisma generate
# - npm run build
```

### Passo 4: Aplicar Migrations em Produção
```bash
# Se houver migrations, aplicar em produção:
npx prisma migrate deploy
```

### Passo 5: Validação Pós-Deploy
```bash
# 1. Acessar aplicação em produção
# 2. Verificar funcionalidades críticas:
#    - Login funciona
#    - Contratos aparecem
#    - Ativos carregam
#    - Criação de novos registros funciona

# 3. Se algo der errado:
#    - Reverter deploy no Vercel
#    - Restaurar backup se necessário
```

**✅ Checklist Pós-Deploy:**
- [ ] Site carregando corretamente
- [ ] Login funcionando
- [ ] Dados existentes visíveis
- [ ] Criação de novos registros funciona
- [ ] Sem erros no console (F12)
- [ ] Clientes notificados (se mudança visível)

---

## 🆘 EM CASO DE EMERGÊNCIA

### Se dados foram perdidos acidentalmente:

1. **NÃO ENTRE EM PÂNICO**
2. **Pare imediatamente** qualquer operação
3. **Restaurar backup:**
   ```bash
   # Encontrar último backup em /backups
   # Restaurar usando:
   psql [DATABASE_URL] < backups/backup-[timestamp].sql
   ```
4. Investigar o que deu errado
5. Corrigir o processo para não repetir

### Contatos de Emergência:
- Suporte Neon.tech: https://neon.tech/docs/introduction
- Documentação Prisma: https://www.prisma.io/docs

---

## 📝 LOGS E MONITORAMENTO

### Verificar logs em produção:
1. Vercel Dashboard → Seu projeto → Logs
2. Prisma Studio (somente visualização)
3. Neon Dashboard → Monitoring

### Backups automáticos do Neon:
- Neon faz backup automático a cada hora
- Retenção: 7 dias (plano gratuito)
- Acesso: Neon Console → Restore → Point-in-Time Recovery

---

## 🔐 VARIÁVEIS DE AMBIENTE CRÍTICAS

### Produção (Vercel):
```
NODE_ENV=production
DATABASE_URL=[string de conexão Neon]
NEXTAUTH_SECRET=[secret seguro]
NEXTAUTH_URL=[URL de produção]
```

### Desenvolvimento:
```
NODE_ENV=development
DATABASE_URL=[banco local ou Neon dev]
```

**⚠️ NUNCA:**
- Compartilhar DATABASE_URL publicamente
- Commitar .env no Git
- Usar mesma DATABASE_URL em dev e produção

---

## 📚 RECURSOS ÚTEIS

- [Documentação Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Neon Backups](https://neon.tech/docs/manage/backups)
- [Vercel Deploy Hooks](https://vercel.com/docs/concepts/git/deploy-hooks)

---

## ✅ RESUMO: 3 REGRAS DE OURO

1. **SEMPRE** faça backup antes de alterações no banco
2. **NUNCA** use `--force-reset` em produção
3. **TESTE** tudo em desenvolvimento primeiro

---

**Data de Criação:** 2026-02-28
**Última Atualização:** 2026-02-28
**Responsável:** Sistema de Segurança ManuFlow
