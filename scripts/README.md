# 🛠️ Scripts de Segurança - ManuFlow

## Scripts Disponíveis

### 1. `backup-db.js` - Backup do Banco de Dados

**Quando usar:**
- SEMPRE antes de fazer alterações no schema do banco
- Antes de deploys importantes
- Regularmente (ex: uma vez por semana)

**Como usar:**
```bash
npm run db:backup
# ou
node scripts/backup-db.js
```

**O que faz:**
- Cria backup completo do banco PostgreSQL
- Salva em `/backups` com timestamp
- Remove backups com mais de 30 dias automaticamente
- Mostra tamanho do arquivo de backup

**Importante:**
- Backups são salvos localmente em `/backups`
- NÃO são commitados no Git (estão no .gitignore)
- Guardar backups em local seguro (Google Drive, Dropbox, etc)

---

### 2. `check-production.js` - Validação de Segurança

**Quando usar:**
- Automaticamente antes de comandos perigosos
- Para validar se está em ambiente correto

**Como usar:**
```bash
npm run production:check
```

**O que faz:**
- Detecta se está em produção
- BLOQUEIA comandos perigosos (--force-reset, etc)
- Protege contra perda acidental de dados

**Comandos bloqueados em produção:**
- `prisma db push --force-reset`
- `prisma db push --accept-data-loss`
- `prisma migrate reset`

---

## Fluxo de Trabalho Seguro

### Desenvolvimento (Testando features)
```bash
# 1. Fazer mudanças no código
# 2. Atualizar schema se necessário
npm run db:push

# 3. Testar localmente
npm run dev
```

### Produção (Com clientes usando)
```bash
# 1. Fazer backup OBRIGATÓRIO
npm run db:backup

# 2. Criar migration (em dev)
npm run db:migrate

# 3. Testar tudo localmente

# 4. Deploy
git push

# 5. Aplicar migration em produção
npm run db:migrate:deploy
```

---

## Scripts NPM Disponíveis

### Banco de Dados
- `npm run db:backup` - Fazer backup
- `npm run db:backup-and-migrate` - Backup + Migration (seguro)
- `npm run db:migrate` - Criar migration (dev)
- `npm run db:migrate:deploy` - Aplicar migrations (prod)
- `npm run db:push` - Atualizar schema (dev)
- `npm run db:studio` - Visualizar dados
- `npm run db:generate` - Gerar Prisma Client

### Validação
- `npm run production:check` - Verificar segurança

---

## Variáveis de Ambiente

### `.env` - Desenvolvimento
```
NODE_ENV=development
DATABASE_URL=postgresql://...
```

### Vercel - Produção
```
NODE_ENV=production
DATABASE_URL=postgresql://...
```

---

## Recuperação de Desastre

Se algo der errado e dados foram perdidos:

### 1. Parar tudo imediatamente
```bash
# NÃO execute mais nenhum comando no banco
```

### 2. Localizar último backup
```bash
# Verificar pasta backups/
ls -lt backups/
# Pegar o mais recente: backup-YYYY-MM-DD...sql
```

### 3. Restaurar backup
```bash
# Usando psql (requer PostgreSQL instalado)
psql [DATABASE_URL] < backups/backup-[timestamp].sql
```

### 4. Verificar restauração
```bash
npm run db:studio
# Verificar se dados voltaram
```

---

## Backup Automático (Neon.tech)

O Neon faz backup automático:
- **Frequência:** A cada hora
- **Retenção:** 7 dias (plano gratuito)
- **Acesso:** Neon Console → Restore → Point-in-Time Recovery

**Como usar Point-in-Time Recovery:**
1. Acessar https://console.neon.tech
2. Selecionar projeto
3. Ir em "Restore"
4. Escolher data/hora específica
5. Criar branch com dados restaurados

---

## Monitoramento

### Logs em Produção (Vercel)
```
https://vercel.com/[seu-projeto]/logs
```

### Banco de Dados (Neon)
```
https://console.neon.tech/[seu-projeto]/monitoring
```

---

## Contatos Úteis

- **Suporte Neon:** https://neon.tech/docs/introduction
- **Prisma Docs:** https://www.prisma.io/docs
- **Vercel Support:** https://vercel.com/support

---

## Checklist Rápido

Antes de deploy em produção:
- [ ] Backup feito (`npm run db:backup`)
- [ ] Testado em dev
- [ ] Migration criada (se necessário)
- [ ] Sem comandos perigosos (`--force-reset`, etc)
- [ ] Variáveis de ambiente configuradas no Vercel

---

**Data de Criação:** 2026-02-28
**Mantenha este documento atualizado conforme novos scripts são adicionados!**
