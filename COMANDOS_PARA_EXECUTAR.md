# 🚀 Comandos Prontos para Executar

## 1️⃣ No Servidor de Produção

### Configurar Variáveis de Ambiente

```bash
# Gere um token forte (pode usar este ou criar o seu)
export CRON_SECRET="LomusTrack_2024_AutomationSecretKey_XyZ123!"

# Configure CORS para aceitar seu domínio + cron-job.org
export CORS_ALLOWED_ORIGINS="https://lomustrack.online,https://api.cron-job.org,https://cron-job.org"

# Se ainda não configurou, adicione também:
export OPENROUTER_API_KEY="sk-or-v1-seu-token-aqui"
export DATABASE_URL="postgresql://user:password@host:5432/lomustrack"
```

### Verificar se as Variáveis Foram Definidas

```bash
echo $CRON_SECRET
echo $CORS_ALLOWED_ORIGINS
```

**Resultado esperado**: Deve mostrar os valores que você definiu.

---

## 2️⃣ Teste Manual (Antes de Configurar o Cron)

### Testar Endpoint com curl

```bash
curl -X GET \
  https://lomustrack.online/api/automation/run \
  -H "Authorization: Bearer LomusTrack_2024_AutomationSecretKey_XyZ123!" \
  -v
```

### Resultado Esperado:

**Status Code**: `200 OK`

**Response Body**:
```json
{
  "ok": true,
  "rules_checked": 0,
  "actions_executed": 0,
  "errors": 0,
  "notification_jobs_retried": 0,
  "notification_deliveries_sent": 0,
  "notification_jobs_failed": 0,
  "reports_sent": 0,
  "reports_failed": 0
}
```

### Erros Comuns:

| Status | Erro | Solução |
|--------|------|---------|
| **401** | Unauthorized | Token errado ou header incorreto |
| **503** | Service Unavailable | `CRON_SECRET` não definido no servidor |
| **Connection refused** | - | Backend não está rodando |

---

## 3️⃣ No cron-job.org

### Passo a Passo:

1. **Acesse**: https://console.cron-job.org/
2. **Login** ou crie uma conta gratuita
3. Clique em **"Create cronjob"**

### Configurações do Cron Job:

```
Title: LomusTrack - Automação Principal
Address (URL): https://lomustrack.online/api/automation/run

Schedule:
  ☑️ Every 10 minutes
  Pattern: */10 * * * *

Request settings:
  Request method: GET
  Request timeout: 60
  Follow redirects: No
  
Headers (clique em "+ Add header"):
  Name: Authorization
  Value: Bearer LomusTrack_2024_AutomationSecretKey_XyZ123!

Notifications:
  ☑️ On failure
  ☑️ On success after failure
  ☐ On success (desligado para evitar spam)
  
  Email: seu-email@gmail.com
```

### Testar no cron-job.org:

1. Clique no cron job criado
2. Clique no botão **"Run now"** (▶️)
3. Aguarde 5-10 segundos
4. Verifique o **"Execution history"**
5. Status esperado: **200 OK**

---

## 4️⃣ Verificar Logs (Opcional)

### No Servidor:

Se estiver usando PM2:
```bash
pm2 logs backend
```

Se estiver usando Docker:
```bash
docker logs -f lomustrack-backend
```

Se estiver rodando direto:
```bash
tail -f /var/log/lomustrack/backend.log
```

### No cron-job.org:

1. Clique no cron job
2. Vá em **"Execution history"**
3. Clique em uma execução para ver detalhes
4. Veja **Response headers** e **Response body**

---

## 5️⃣ Criar Superadmin (Se Ainda Não Fez)

### Conectar no PostgreSQL:

```bash
psql -U seu_usuario -d lomustrack
```

### Executar SQL:

```sql
-- Senha: yuld0000
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

### Verificar:

```sql
SELECT id, name, email, role FROM admins WHERE email = 'suporte@lomustrack.online';
```

**Resultado esperado**: 1 linha com role = 'superadmin'

---

## 6️⃣ Checklist Final

Marque conforme for completando:

- [ ] Variáveis de ambiente definidas no servidor
  - [ ] `CRON_SECRET`
  - [ ] `CORS_ALLOWED_ORIGINS`
  - [ ] `OPENROUTER_API_KEY`
  - [ ] `DATABASE_URL`

- [ ] Backend deployado e rodando
  - [ ] Teste com `curl` retornou 200 OK
  - [ ] Endpoint `/api/health` responde

- [ ] Superadmin criado
  - [ ] SQL executado sem erros
  - [ ] Login funciona em `/admin-login`

- [ ] Cron job configurado no cron-job.org
  - [ ] URL: `https://lomustrack.online/api/automation/run`
  - [ ] Schedule: `*/10 * * * *`
  - [ ] Header `Authorization` configurado
  - [ ] Teste manual (Run now) retornou 200 OK

- [ ] Primeira execução automática
  - [ ] Aguardou 10 minutos
  - [ ] Verificou execution history
  - [ ] Status 200 OK

- [ ] Monitoramento configurado
  - [ ] Notificações de erro ativadas
  - [ ] Email de notificação configurado

---

## 7️⃣ Comandos de Troubleshooting

### Se o backend não aceitar requisições do cron-job.org:

```bash
# Verifique se as variáveis estão definidas
env | grep CRON_SECRET
env | grep CORS_ALLOWED_ORIGINS

# Se não estiverem, defina novamente:
export CRON_SECRET="LomusTrack_2024_AutomationSecretKey_XyZ123!"
export CORS_ALLOWED_ORIGINS="https://lomustrack.online,https://api.cron-job.org,https://cron-job.org"

# Reinicie o backend
pm2 restart backend
# OU
docker restart lomustrack-backend
# OU
systemctl restart lomustrack-backend
```

### Se o lock travar (erro 409):

```sql
-- Remove locks travados
DELETE FROM automation_locks WHERE lock_key = 712034;
```

### Ver últimas execuções de automação:

```sql
-- Ver últimas regras executadas
SELECT 
  action, 
  resource_id, 
  details->'rule_name' as rule_name,
  created_at
FROM audit_log 
WHERE action = 'campaign_rule.execute'
ORDER BY created_at DESC 
LIMIT 20;

-- Ver últimos relatórios enviados
SELECT 
  title, 
  status, 
  sent_count, 
  failed_count, 
  created_at
FROM notification_delivery 
WHERE data->>'kind' = 'scheduled_report'
ORDER BY created_at DESC 
LIMIT 20;
```

---

## 8️⃣ URLs Importantes

| Recurso | URL |
|---------|-----|
| **Frontend** | https://lomustrack.online |
| **Login Admin** | https://lomustrack.online/admin-login |
| **API Health** | https://lomustrack.online/api/health |
| **Endpoint Automação** | https://lomustrack.online/api/automation/run |
| **Console cron-job.org** | https://console.cron-job.org/ |

---

## 🎉 Pronto!

Depois de executar todos os comandos acima, sua automação estará 100% funcional.

**A cada 10 minutos**, o cron-job.org vai chamar o endpoint e:
- ✅ Executar regras de campanha
- ✅ Enviar relatórios agendados
- ✅ Retentar notificações pendentes

**Nenhuma intervenção manual necessária!** 🚀
