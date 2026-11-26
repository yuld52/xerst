# ⏰ Configuração de Cron Jobs para LomusTrack

Este documento explica como configurar tarefas agendadas usando [cron-job.org](https://console.cron-job.org/) para automatizar processos no LomusTrack.

## 📋 Pré-requisitos

1. **Backend deployado e ativo** em https://www.lomustrack.online/api
2. **Conta criada** em [cron-job.org](https://console.cron-job.org/)
3. **Token de autorização** para proteger os endpoints

---

## 🎯 Endpoints de Automação Disponíveis

### 1. **Automação Completa** (Recomendado)
Executa todas as tarefas: regras de campanha, retry de notificações e relatórios agendados.

```
GET https://www.lomustrack.online/api/automation/run
```

### 2. **Apenas Relatórios Agendados**
Envia relatórios push notificações para usuários.

```
GET https://www.lomustrack.online/api/automation/reports/run
```

### 3. **Retry de Notificações Push**
Reprocessa notificações que falharam.

```
GET https://www.lomustrack.online/api/automation/notifications/retry
```

---

## 🔐 Configuração de Segurança

### Gerar Token de Autorização

O backend já verifica um cabeçalho `Authorization` para proteger os endpoints de cron jobs.

**Recomendação:** Use uma string aleatória forte como token.

```bash
# Exemplo de token (gere um diferente!)
CRON_SECRET=lomustrack_cron_2024_secure_token_xyz789
```

Adicione isso nas **variáveis de ambiente** do seu backend (Vercel/Render/etc):

```env
CRON_SECRET=seu_token_secreto_aqui
```

---

## ⚙️ Configuração no cron-job.org

### Passo 1: Criar Nova Tarefa

1. Acesse [console.cron-job.org](https://console.cron-job.org/)
2. Clique em **"Create cronjob"**
3. Preencha os dados:

---

### **📋 Configuração Recomendada: 2 Cron Jobs Separados**

#### **CRON JOB 1: Regras de Campanhas (A cada 10 minutos)**

| Campo | Valor |
|-------|-------|
| **Title** | LomusTrack - Regras de Campanhas |
| **Address (URL)** | `https://www.lomustrack.online/api/automation/run` |
| **Schedule** | Every 10 minutes (`*/10 * * * *`) |
| **Request method** | GET |
| **Request timeout** | 60 seconds |
| **Custom request headers** | `Authorization: Bearer SEU_TOKEN_AQUI` |

**Como configurar o Schedule:**
1. Na seção "Schedule", procure por **"Minutes"**
2. Digite: `*/10` (a cada 10 minutos)
3. Ou use a opção **"Custom"** e cole: `*/10 * * * *`

**Resultado:** Executa nos minutos 00, 10, 20, 30, 40, 50 de cada hora

---

#### **CRON JOB 2: Relatórios e Notificações (A cada hora)**

| Campo | Valor |
|-------|-------|
| **Title** | LomusTrack - Relatórios e Notificações |
| **Address (URL)** | `https://www.lomustrack.online/api/automation/reports/run` |
| **Schedule** | Every hour (`0 */1 * * *`) |
| **Request method** | GET |
| **Request timeout** | 60 seconds |
| **Custom request headers** | `Authorization: Bearer SEU_TOKEN_AQUI` |

**Como configurar o Schedule:**
1. Na seção "Schedule", marque **"Every hour"**
2. Minutes: `0`
3. Hours: `*/1`

**Resultado:** Executa às 00:00, 01:00, 02:00, 03:00... (todos os dias)

---

### **🎯 Alternativa Simples: 1 Cron Job (A cada 10 minutos)**

Se preferir ter apenas 1 cron job:

#### **Tarefa 1: Automação Completa (Executar de 10 em 10 minutos)**

| Campo | Valor |
|-------|-------|
| **Title** | LomusTrack - Automação Completa |
| **Address (URL)** | `https://www.lomustrack.online/api/automation/run` |
| **Schedule** | Every hour (0 */1 * * *) |
| **Request method** | GET |
| **Request timeout** | 60 seconds |
| **Custom request headers** | `Authorization: Bearer SEU_TOKEN_AQUI` |

#### **Tarefa 1: Automação Completa (A cada 10 minutos)**

| Campo | Valor |
|-------|-------|
| **Title** | LomusTrack - Automação Completa |
| **Address (URL)** | `https://www.lomustrack.online/api/automation/run` |
| **Schedule** | Every 10 minutes (`*/10 * * * *`) |
| **Request method** | GET |
| **Request timeout** | 60 seconds |
| **Custom request headers** | `Authorization: Bearer SEU_TOKEN_AQUI` |

---

### **📊 Comparação das Estratégias**

| Aspecto | 2 Cron Jobs (Recomendado) | 1 Cron Job (Simples) |
|---------|---------------------------|----------------------|
| **Regras de Campanhas** | ✅ A cada 10 min | ✅ A cada 10 min |
| **Relatórios Push** | ✅ Apenas nos horários escolhidos | ✅ Apenas nos horários escolhidos |
| **Economia de Recursos** | ✅ Maior (menos chamadas IA) | ⚠️ Menor |
| **Complexidade** | ⚠️ Precisa criar 2 jobs | ✅ Apenas 1 job |
| **Uso no Plano Gratuito** | 2 de 50 jobs | 1 de 50 jobs |
| **Recomendado para** | Produção | Teste/Desenvolvimento |

---

## 📅 Sugestões de Agendamento

### **Plano Gratuito do cron-job.org:**
- ✅ Até 50 cron jobs
- ✅ Mínimo de 1 minuto entre execuções
- ✅ Notificações por email em caso de falha

### **Configuração Recomendada (2 Cron Jobs):**

#### **Cron Job 1: Regras de Campanhas (Prioritário)**

| Campo | Valor |
|-------|-------|
| **Tarefa** | Verificar e executar regras de campanhas |
| **Frequência** | A cada 10 minutos |
| **Cron Expression** | `*/10 * * * *` |
| **Endpoint** | `/automation/run` |
| **Por quê?** | Resposta rápida a mudanças nas métricas, evita desperdício |

#### **Cron Job 2: Relatórios e Notificações**

| Campo | Valor |
|-------|-------|
| **Tarefa** | Enviar relatórios push e retry notificações |
| **Frequência** | A cada hora |
| **Cron Expression** | `0 */1 * * *` |
| **Endpoint** | `/automation/reports/run` ou `/automation/run` |
| **Por quê?** | Economiza IA, evita spam de relatórios |

---

### **Alternativa Simples (1 Cron Job):**

Se preferir simplicidade, use apenas **1 cron job executando a cada 10 minutos**:

| Campo | Valor |
|-------|-------|
| **Tarefa** | Automação completa (regras + relatórios + retry) |
| **Frequência** | A cada 10 minutos |
| **Cron Expression** | `*/10 * * * *` |
| **Endpoint** | `/automation/run` |

**Resultado:**
- ✅ Regras verificadas a cada 10 minutos
- ✅ Relatórios enviados apenas nos horários configurados pelo usuário
- ✅ Notificações reprocessadas automaticamente

---

## 🛡️ Protegendo o Endpoint

### No Backend (FastAPI)

Adicione verificação do token:

```python
# Já está implementado em api/automation.py

@router.get("/automation/run")
async def run_scheduled_automation(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    expected_token = os.getenv("CRON_SECRET", "")
    
    # Verificar token
    if not authorization or authorization.replace("Bearer ", "") != expected_token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Executar tarefas...
```

---

## 📊 Monitoramento

### No cron-job.org:

1. **Dashboard** mostra execuções recentes
2. **History** exibe logs detalhados
3. **Notifications** configura alertas de falha por email

### Logs no Backend:

Verifique os logs de execução:
- Relatórios enviados
- Notificações processadas
- Regras de campanha executadas

---

## 🔄 Exemplo de Resposta dos Endpoints

### Sucesso (200 OK):

```json
{
  "ok": true,
  "rules_checked": 5,
  "notifications_retried": 2,
  "reports_sent": 10,
  "reports_failed": 0
}
```

### Erro (401 Unauthorized):

```json
{
  "detail": "Unauthorized"
}
```

---

## 🚀 Configuração Rápida

### 1. Adicionar Header no cron-job.org

Ao criar o cron job, clique em **"Extended"** → **"Custom request headers"**:

```
Authorization: Bearer lomustrack_cron_2024_xyz789
```

### 2. Testar Manualmente

Use cURL para testar:

```bash
curl -X GET "https://www.lomustrack.online/api/automation/run" \
  -H "Authorization: Bearer seu_token_aqui"
```

### 3. Verificar Logs

Após a primeira execução, verifique:
- ✅ Status code 200
- ✅ Resposta JSON com `"ok": true`
- ✅ Logs no painel do cron-job.org

---

## ⚠️ Limitações do Plano Gratuito

| Recurso | Gratuito | Pago |
|---------|----------|------|
| Número de jobs | 50 | Ilimitado |
| Frequência mínima | 1 minuto | 1 minuto |
| Timeout máximo | 30 segundos | 300 segundos |
| Logs retidos | 7 dias | 90 dias |
| Notificações | Email | Email + Webhook |

---

## 🎓 Dicas Extras

### 1. **Usar Webhooks para Monitoramento**
Configure um webhook no cron-job.org para receber notificações de falhas.

### 2. **Configurar Retry Automático**
No cron-job.org, ative **"Enable error notification"** para receber alertas.

### 3. **Verificar Logs Regularmente**
Acesse o histórico de execuções para identificar falhas.

### 4. **Testar Antes de Ativar**
Use a opção **"Run now"** no cron-job.org para testar manualmente.

---

## 📝 Checklist de Configuração

- [ ] Backend deployado e ativo
- [ ] Variável `CRON_SECRET` configurada no backend
- [ ] Conta criada no cron-job.org
- [ ] Cron job "Automação Completa" configurado
- [ ] Cron job "Relatórios Diários" configurado
- [ ] Header `Authorization` adicionado
- [ ] Teste manual executado com sucesso
- [ ] Primeira execução automática verificada
- [ ] Notificações de erro ativadas

---

## 🆘 Problemas Comuns

### 1. **Erro 401 Unauthorized**
- ✅ Verifique se o header `Authorization` está correto
- ✅ Confirme que `CRON_SECRET` está configurado no backend

### 2. **Erro 500 Internal Server Error**
- ✅ Verifique os logs do backend
- ✅ Confirme que o banco de dados está acessível

### 3. **Timeout**
- ✅ Aumente o timeout no cron-job.org (máx 30s no gratuito)
- ✅ Otimize as queries do backend

### 4. **Execução não acontece**
- ✅ Verifique se o cron job está **ativado** (enabled)
- ✅ Confirme o horário (timezone UTC)

---

## 📚 Recursos Adicionais

- [Documentação cron-job.org](https://docs.cron-job.org/)
- [Cron Expression Generator](https://crontab.guru/)
- [FastAPI Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/)

---

✅ **Pronto!** Seus cron jobs estão configurados e o LomusTrack agora executa tarefas automatizadas! 🎉


---

## 🆕 Novidade: Múltiplos Horários de Relatório

A partir de agora, os usuários podem **escolher múltiplos horários** para receber relatórios!

### **Como Funciona:**

1. **No Painel do LomusTrack:**
   - Acesse **Configurações** → **Notificações**
   - Na seção "Horários", escolha quantos horários quiser:
     - ☑️ Notificação das 08:00
     - ☑️ Notificação das 12:00
     - ☑️ Notificação das 18:00
     - ☑️ Notificação das 23:00

2. **Backend Verifica Automaticamente:**
   - A cada execução do cron job, o backend verifica o horário UTC atual
   - Se o horário atual está ativado pelo usuário → Envia relatório
   - Se não está ativado → Pula e não envia

3. **Exemplo Prático:**
   ```
   Usuário ativou: ☑️ 08:00 e ☑️ 20:00
   
   Cron job executando a cada hora:
   - 07:00 UTC → Verifica → Não ativado → Pula
   - 08:00 UTC → Verifica → ✅ Ativado → 📊 ENVIA RELATÓRIO
   - 09:00 UTC → Verifica → Não ativado → Pula
   ...
   - 20:00 UTC → Verifica → ✅ Ativado → 📊 ENVIA RELATÓRIO
   ```

### **Configuração do Cron Job:**

**Recomendação:** Configure para executar **a cada hora**

```yaml
Title: LomusTrack - Automação Completa

URL: https://www.lomustrack.online/api/automation/run

Schedule: Every hour (0 */1 * * *)

Headers:
  Authorization: Bearer 92fc1f5434fe55a3a28257f96758f08a4317546187c4008723c56b853b91d18f
```

Dessa forma, o backend verifica a cada hora e envia relatórios apenas nos horários que o usuário escolheu!

### **Vantagens:**

✅ **Flexibilidade total** - Usuário escolhe quantos horários quiser  
✅ **Sem duplicatas** - Backend garante 1 relatório por horário por dia  
✅ **Economia de IA** - Só gera relatórios quando necessário  
✅ **Personalização** - Cada usuário pode ter horários diferentes  

