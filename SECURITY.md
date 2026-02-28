# 🔐 Política de Segurança de Dados - ManuFlow

## 🎯 Objetivo

**NUNCA PERDER DADOS DE CLIENTES**

Este documento estabelece as políticas e procedimentos para garantir a segurança e integridade dos dados em todos os ambientes.

---

## 🚨 Regras Críticas

### ❌ NUNCA FAZER:

1. **Executar `--force-reset` em produção**
   ```bash
   # ❌ BLOQUEADO EM PRODUÇÃO
   npx prisma db push --force-reset
   npx prisma migrate reset
   ```

2. **Fazer alterações no banco sem backup**
   ```bash
   # ❌ ERRADO
   npx prisma db push

   # ✅ CORRETO
   npm run db:backup
   npx prisma db push
   ```

3. **Usar mesma DATABASE_URL em dev e produção**
   - Sempre ter bancos separados
   - Dev: para testes
   - Prod: apenas código testado

### ✅ SEMPRE FAZER:

1. **Backup antes de alterações**
   ```bash
   npm run db:backup
   ```

2. **Testar em desenvolvimento primeiro**
   ```bash
   npm run dev
   # Testar tudo localmente
   ```

3. **Usar migrations em produção**
   ```bash
   npm run db:migrate:deploy
   ```

---

## 🛡️ Proteções Implementadas

### 1. Script de Backup Automático
- **Localização:** `scripts/backup-db.js`
- **Uso:** `npm run db:backup`
- **Funcionalidade:**
  - Cria backup completo do banco
  - Salva em `/backups` com timestamp
  - Remove backups antigos (>30 dias)

### 2. Validação de Produção
- **Localização:** `scripts/check-production.js`
- **Funcionalidade:**
  - Detecta ambiente de produção
  - BLOQUEIA comandos perigosos
  - Impede perda acidental de dados

### 3. Scripts Seguros (package.json)
```json
{
  "db:backup": "Fazer backup",
  "db:backup-and-migrate": "Backup + Migration seguro",
  "db:migrate:deploy": "Aplicar migrations em produção",
  "production:check": "Verificar segurança"
}
```

### 4. Backups Automáticos (Neon.tech)
- Backup a cada hora
- Retenção: 7 dias
- Point-in-Time Recovery disponível

---

## 📋 Processos Obrigatórios

### Alteração no Schema do Banco

#### Em Desenvolvimento:
```bash
# 1. Fazer mudança no schema (prisma/schema.prisma)
# 2. Atualizar banco
npm run db:push
# 3. Testar
npm run dev
```

#### Em Produção:
```bash
# 1. Backup OBRIGATÓRIO
npm run db:backup

# 2. Criar migration (em dev)
npm run db:migrate

# 3. Testar localmente

# 4. Deploy
git push

# 5. Aplicar em produção
npm run db:migrate:deploy

# 6. Validar (acessar site, verificar dados)
```

---

## 🆘 Recuperação de Desastre

### Cenário 1: Dados perdidos recentemente

```bash
# 1. PARAR tudo imediatamente

# 2. Verificar último backup local
ls -lt backups/

# 3. Restaurar
psql [DATABASE_URL] < backups/backup-[timestamp].sql

# 4. Validar restauração
npm run db:studio
```

### Cenário 2: Precisar voltar algumas horas atrás

```bash
# 1. Acessar Neon Console
# https://console.neon.tech

# 2. Ir em "Restore" → "Point-in-Time Recovery"

# 3. Selecionar data/hora desejada

# 4. Criar branch com dados restaurados

# 5. Atualizar DATABASE_URL para branch restaurado
```

---

## 📊 Ambientes

### Desenvolvimento (Local)
- **NODE_ENV:** `development`
- **Banco:** Neon branch "dev" ou banco local
- **Pode:** Fazer `db push --force-reset`
- **Objetivo:** Testar mudanças

### Produção (Vercel)
- **NODE_ENV:** `production`
- **Banco:** Neon branch "main"
- **BLOQUEADO:** `--force-reset`, `--accept-data-loss`
- **Objetivo:** Estabilidade e segurança

---

## 🔑 Variáveis de Ambiente

### Desenvolvimento (`.env`)
```env
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@host/db_dev
NEXTAUTH_SECRET=dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000
```

### Produção (Vercel Dashboard)
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host/db_prod
NEXTAUTH_SECRET=[gerado com: openssl rand -base64 32]
NEXTAUTH_URL=https://seu-dominio.com
```

---

## 📝 Logs e Auditoria

### Logs de Produção:
- **Vercel:** https://vercel.com/[projeto]/logs
- **Neon:** https://console.neon.tech/[projeto]/monitoring

### Informações capturadas:
- Todas as queries executadas
- Erros e exceções
- Tempo de resposta
- Uso de recursos

---

## 👥 Responsabilidades

### Desenvolvedor:
- ✅ Fazer backup antes de alterações
- ✅ Testar em dev antes de prod
- ✅ Seguir checklist de deploy
- ✅ Documentar mudanças significativas

### Sistema:
- ✅ Backup automático (Neon)
- ✅ Validação de comandos perigosos
- ✅ Logs de todas as operações

---

## 📚 Documentação Relacionada

- [DEPLOY-CHECKLIST.md](./DEPLOY-CHECKLIST.md) - Checklist completo de deploy
- [scripts/README.md](./scripts/README.md) - Documentação dos scripts
- [Prisma Docs](https://www.prisma.io/docs) - Documentação oficial
- [Neon Docs](https://neon.tech/docs) - Documentação do banco

---

## 🔄 Atualizações

Este documento deve ser atualizado sempre que:
- Novos scripts de segurança forem adicionados
- Processos mudarem
- Novos ambientes forem criados
- Incidentes de segurança ocorrerem

**Última Atualização:** 2026-02-28
**Versão:** 1.0
**Próxima Revisão:** 2026-03-28
