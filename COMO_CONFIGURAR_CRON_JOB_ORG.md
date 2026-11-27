# ⚡ Configuração Rápida: cron-job.org

## 📋 Passo 1: Configurar Variáveis no Servidor

No seu servidor de produção, defina estas variáveis:

```bash
export CRON_SECRET="Token_Secreto_Forte_123456789"
export CORS_ALLOWED_ORIGINS="https://lomustrack.online,https://api.cron-job.org,https://cron-job.org"
```

**Importante**: Escolha um `CRON_SECRET` forte e único.

---

## 🌐 Passo 2: Criar Cron Job

1. Acesse: https://console.cron-job.org/
2. Clique em **"Create cronjob"**

### Configurações:

| Campo | Valor |
|-------|-------|
| **Title** | `LomusTrack - Automação` |
| **URL** | `https://lomustrack.online/api/automation/run` |
| **Schedule** | `*/10 * * * *` (a cada 10 minutos) |
| **Request method** | GET |
| **Timeout** | 60 segundos |

### Header (Obrigatório):

Clique em **"+ Add header"**:

```
Name: Authorization
Value: Bearer Token_Secreto_Forte_123456789
```

⚠️ **Use o mesmo token que você definiu em `CRON_SECRET`**

---

## ✅ Passo 3: Testar

### Teste Manual:

```bash
curl -X GET \
  https://lomustrack.online/api/automation/run \
  -H "Authorization: Bearer Token_Secreto_Forte_123456789"
```

**Resposta esperada:**
```json
{
  "ok": true,
  "rules_checked": 0,
  "actions_executed": 0,
  "errors": 0,
  "reports_sent": 0,
  "reports_failed": 0
}
```

### Teste no cron-job.org:

1. Clique no job criado
2. Clique no botão **"Run now"** (▶️)
3. Verifique o status: deve ser **200 OK**

---

## 🔍 O que a Automação Faz?

Executado **a cada 10 minutos** (144x por dia):

1. ✅ **Regras de Campanha**: Ativa, pausa ou ajusta orçamentos automaticamente
2. 📊 **Relatórios Agendados**: Envia notificações push nos horários configurados
3. 🔄 **Retry de Notificações**: Reenvia notificações que falharam

---

## ⚠️ Troubleshooting

### Erro 401 Unauthorized
- Verifique se `CRON_SECRET` está definido no servidor
- Confirme que o header tem exatamente: `Bearer {token}`

### Erro 503 Service Unavailable
- `CRON_SECRET` não está configurado
- Reinicie o servidor após definir a variável

### Erro de CORS
- Adicione `https://api.cron-job.org` ao `CORS_ALLOWED_ORIGINS`
- Reinicie o backend

---

## 📊 Monitoramento

No painel do cron-job.org:
- **Execution history**: veja as últimas 100 execuções
- **Success rate**: % de execuções bem-sucedidas
- Configure notificações para ser alertado sobre falhas

---

## 🎯 Checklist Final

- [ ] `CRON_SECRET` definido no servidor
- [ ] `CORS_ALLOWED_ORIGINS` inclui cron-job.org
- [ ] Backend deployado e rodando
- [ ] Cron job criado no cron-job.org
- [ ] Header Authorization configurado
- [ ] Teste manual retornou 200 OK
- [ ] Teste no cron-job.org funcionou

---

**Pronto!** A automação está configurada e vai rodar automaticamente a cada 10 minutos. 🚀
