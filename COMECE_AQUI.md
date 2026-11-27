# 👋 COMECE AQUI

## 🎯 Configuração em 3 Passos

### 1️⃣ No Servidor (2 minutos)

Copie e cole estas 2 linhas no seu servidor:

```bash
export CRON_SECRET="LomusTrack_2024_AutomationSecretKey_XyZ123!"
export CORS_ALLOWED_ORIGINS="https://lomustrack.online,https://api.cron-job.org,https://cron-job.org"
```

---

### 2️⃣ No cron-job.org (3 minutos)

1. **Acesse**: https://console.cron-job.org/
2. **Clique**: "Create cronjob"
3. **Preencha**:
   - URL: `https://lomustrack.online/api/automation/run`
   - Schedule: `*/10 * * * *`
4. **Adicione Header** (clique "+ Add header"):
   - Name: `Authorization`
   - Value: `Bearer LomusTrack_2024_AutomationSecretKey_XyZ123!`
5. **Salve**

---

### 3️⃣ Teste (1 minuto)

```bash
curl -X GET \
  https://lomustrack.online/api/automation/run \
  -H "Authorization: Bearer LomusTrack_2024_AutomationSecretKey_XyZ123!"
```

**Deve retornar**: `{"ok": true, ...}`

---

## ✅ Pronto!

A automação vai rodar **a cada 10 minutos** automaticamente:
- ✅ Regras de campanha
- ✅ Relatórios agendados
- ✅ Retry de notificações

**Zero intervenção manual necessária!** 🎉

---

## 📚 Quer Mais Detalhes?

| Documento | Quando Usar |
|-----------|-------------|
| [COMANDOS_PARA_EXECUTAR.md](COMANDOS_PARA_EXECUTAR.md) | Comandos detalhados com troubleshooting |
| [COMO_CONFIGURAR_CRON_JOB_ORG.md](COMO_CONFIGURAR_CRON_JOB_ORG.md) | Guia rápido com prints |
| [CONFIGURACAO_CRON_JOB_ORG.md](CONFIGURACAO_CRON_JOB_ORG.md) | Guia técnico completo (500+ linhas) |
| [INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md) | Índice de toda a documentação |

---

## 🆘 Problemas?

| Erro | Solução |
|------|---------|
| **401 Unauthorized** | Verifique se o token está correto |
| **503 Service Unavailable** | Defina `CRON_SECRET` no servidor |
| **Connection refused** | Backend não está rodando |

**Ver troubleshooting completo**: [CONFIGURACAO_CRON_JOB_ORG.md](CONFIGURACAO_CRON_JOB_ORG.md) - Seção 8

---

**Dúvidas?** suporte@lomustrack.online
