# 🚀 Como Fazer Deploy no Render

## 1️⃣ Criar Conta no Render

1. Acesse: https://render.com
2. Clique em **"Get Started"**
3. Faça login com GitHub
4. Autorize o Render a acessar seus repositórios

---

## 2️⃣ Criar Web Service

1. No dashboard, clique em **"New +"**
2. Selecione **"Web Service"**
3. Conecte seu repositório: `yuld52/xerst`
4. Clique em **"Connect"**

---

## 3️⃣ Configurar o Service

### Basic Settings:

| Campo | Valor |
|-------|-------|
| **Name** | `lomustrack-backend` |
| **Region** | Escolha mais próximo (ex: Frankfurt) |
| **Branch** | `master` |
| **Root Directory** | `soclt-main/reference/original-backend` |
| **Runtime** | `Python 3` |

### Build & Deploy:

| Campo | Valor |
|-------|-------|
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app:app --host 0.0.0.0 --port $PORT` |

### Plan:

- **Free** (para começar) ou **Starter $7/mês** (para produção)

---

## 4️⃣ Adicionar PostgreSQL

### Opção A: PostgreSQL no Render (Recomendado)

1. No dashboard, clique em **"New +"**
2. Selecione **"PostgreSQL"**
3. Nome: `lomustrack-db`
4. Plan: **Free** ou **Starter $7/mês**
5. Clique em **"Create Database"**
6. Copie a **Internal Database URL**

### Opção B: Usar Supabase (Já Existente?)

Se você já tem PostgreSQL no Supabase, use a connection string de lá.

---

## 5️⃣ Configurar Variáveis de Ambiente

No seu Web Service, vá em **"Environment"** e adicione:

### Variáveis Obrigatórias:

```
DATABASE_URL=postgresql://user:password@host:5432/lomustrack
CRON_SECRET=LomusTrack_2024_AutomationSecretKey_XyZ123!
CORS_ALLOWED_ORIGINS=https://lomustrack.online,https://api.cron-job.org,https://cron-job.org
OPENROUTER_API_KEY=sk-or-v1-seu-token-aqui
```

### Variáveis Opcionais:

```
FACEBOOK_APP_ID=seu-app-id
FACEBOOK_APP_SECRET=seu-app-secret
VAPID_PUBLIC_KEY=seu-vapid-public
VAPID_PRIVATE_KEY=seu-vapid-private
VAPID_SUBJECT=mailto:suporte@lomustrack.online
```

**Dica**: Use a `DATABASE_URL` copiada do PostgreSQL do Render (Opção A).

---

## 6️⃣ Deploy!

1. Clique em **"Save Changes"** ou **"Manual Deploy"**
2. Aguarde o build (1-3 minutos)
3. Render vai:
   - Instalar dependências (`pip install`)
   - Iniciar o servidor (`uvicorn`)
   - Gerar uma URL: `https://lomustrack-backend.onrender.com`

---

## 7️⃣ Testar o Deploy

### Teste o Health Endpoint:

```bash
curl https://lomustrack-backend.onrender.com/api/health
```

**Resposta esperada**:
```json
{
  "status": "healthy"
}
```

### Teste o Endpoint de Automação:

```bash
curl -X GET \
  https://lomustrack-backend.onrender.com/api/automation/run \
  -H "Authorization: Bearer LomusTrack_2024_AutomationSecretKey_XyZ123!"
```

**Resposta esperada**:
```json
{
  "ok": true,
  "rules_checked": 0,
  "actions_executed": 0,
  ...
}
```

---

## 8️⃣ Criar Superadmin

Conecte no PostgreSQL e execute:

```sql
INSERT INTO admins (
  name, 
  email, 
  password_hash, 
  role, 
  company_id, 
  is_active, 
  is_email_verified, 
  two_factor_enabled, 
  token_version, 
  subscription_plan, 
  preferences, 
  created_at
) 
VALUES (
  'Suporte LomusTrack', 
  'suporte@lomustrack.online', 
  '$2b$12$PjHLusTkUC.V4.VIAwQ6teVti1rZWdBmsxINs9ve2wJ8SNOZZ2CUW', 
  'superadmin', 
  NULL, 
  1, 
  TRUE, 
  FALSE, 
  1, 
  'free', 
  '{}', 
  NOW()
);
```

**Senha**: `yuld0000`

---

## 9️⃣ Configurar cron-job.org

Agora use a URL do Render no cron-job.org:

1. Acesse: https://console.cron-job.org/
2. Crie cron job:
   - **URL**: `https://lomustrack-backend.onrender.com/api/automation/run`
   - **Schedule**: `*/10 * * * *`
   - **Header**: `Authorization: Bearer LomusTrack_2024_AutomationSecretKey_XyZ123!`

---

## 🔟 Conectar Frontend ao Backend

### Se o frontend está em outro lugar (Vercel, Lovable):

Atualize a URL da API no frontend:

**Arquivo**: `src/config.ts` ou similar

```typescript
export const API_URL = "https://lomustrack-backend.onrender.com/api"
```

### Se o frontend está no Render também:

Pode usar a mesma instância ou criar outra Web Service para o frontend.

---

## ✅ Checklist Final

- [ ] Conta criada no Render
- [ ] Web Service criado
- [ ] PostgreSQL criado (ou usando Supabase)
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy concluído com sucesso
- [ ] Teste `/api/health` retornou 200 OK
- [ ] Teste `/api/automation/run` retornou 200 OK
- [ ] Superadmin criado no banco
- [ ] cron-job.org configurado com nova URL
- [ ] Frontend conectado ao novo backend

---

## 📊 Monitoramento no Render

### Logs:

1. Vá no seu Web Service
2. Clique na aba **"Logs"**
3. Veja logs em tempo real

### Métricas:

1. Clique na aba **"Metrics"**
2. Veja:
   - CPU usage
   - Memory usage
   - Response time

### Auto-Deploy:

✅ Render automaticamente faz deploy quando você fizer push no GitHub!

---

## 💰 Custos

### Free Plan:
- ✅ 750 horas/mês grátis
- ✅ Automatic sleep após 15 min inativo
- ⚠️ Cold start (~30s) na primeira requisição

### Starter Plan ($7/mês):
- ✅ Sem sleep/cold start
- ✅ Uptime 99.9%
- ✅ Recomendado para produção

### PostgreSQL:
- ✅ Free: 1GB storage, 90 dias de backups
- ✅ Starter $7/mês: 10GB storage, backups ilimitados

**Total recomendado para produção**: $14/mês (Web + DB)

---

## 🆘 Troubleshooting

### Build Failed:

**Erro**: `Could not find requirements.txt`

**Solução**: Verifique se o **Root Directory** está correto:
```
soclt-main/reference/original-backend
```

---

### Database Connection Failed:

**Erro**: `could not connect to server`

**Solução**: 
1. Verifique se `DATABASE_URL` está correta
2. Use a **Internal Database URL** do Render (não a External)

---

### CORS Error:

**Erro**: `CORS policy blocked`

**Solução**: Adicione o domínio do frontend ao `CORS_ALLOWED_ORIGINS`:
```
CORS_ALLOWED_ORIGINS=https://lomustrack.online,https://seu-frontend.vercel.app,https://api.cron-job.org
```

---

### Cold Start (Free Plan):

**Problema**: Primeira requisição demora ~30s

**Solução**:
- Upgrade para Starter Plan ($7/mês)
- OU use um "keep-alive" service (ex: UptimeRobot) que faz ping a cada 5 min

---

## 🌟 Vantagens do Render

✅ **Zero Downtime Deploys** - Deploy sem derrubar o serviço
✅ **Auto-scaling** - Escala automaticamente sob carga
✅ **SSL/HTTPS Gratuito** - Certificado automático
✅ **Logs em Tempo Real** - Debug fácil
✅ **Git Deploy** - Push no GitHub = deploy automático
✅ **Rollback Fácil** - Volte para versão anterior com 1 clique

---

## 📞 Suporte

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Status**: https://status.render.com

---

**Pronto!** Seu backend estará rodando em produção no Render. 🚀
