# Configuração do Cron-Job.org para LomusTrack

## Visão Geral

Este guia explica como configurar o backend do LomusTrack para aceitar requisições vindas do serviço **cron-job.org**, que executa a automação a cada 10 minutos.

---

## 1. O que é o cron-job.org?

**cron-job.org** é um serviço de agendamento de tarefas na nuvem que faz requisições HTTP para endpoints específicos em intervalos configurados.

### Configuração atual:
- **Intervalo**: A cada 10 minutos (`*/10 * * * *`)
- **Endpoint**: `https://seu-dominio.com/api/automation/run`
- **Método**: GET
- **Execuções**: 144 vezes por dia

---

## 2. Requisitos de Segurança

### 2.1. CRON_SECRET (Obrigatório)

O backend já valida um token Bearer no header `Authorization`:

```python
def _cron_auth(authorization: str | None) -> None:
    expected = os.getenv("CRON_SECRET")
    if not expected:
        raise HTTPException(status_code=503, detail="CRON_SECRET não configurado")
    if authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Não autorizado")
```

**Você precisa:**
1. Definir a variável de ambiente `CRON_SECRET` no servidor:
   ```bash
   export CRON_SECRET="seu-token-secreto-aqui-123456"
   ```

2. Configurar o header no cron-job.org:
   - **Header name**: `Authorization`
   - **Header value**: `Bearer seu-token-secreto-aqui-123456`

---

## 3. Configuração do CORS

### 3.1. Adicionar cron-job.org aos Origins Permitidos

O backend LomusTrack usa CORS para controlar quais domínios podem fazer requisições.

**Localização**: `soclt-main/reference/original-backend/app.py`

#### Configuração Atual:
```python
cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:8080,http://localhost:5173",
    ).split(",")
    if origin.strip()
]
```

#### Configuração Recomendada:

Adicione os domínios do cron-job.org à variável de ambiente `CORS_ALLOWED_ORIGINS`:

```bash
export CORS_ALLOWED_ORIGINS="http://localhost:8080,http://localhost:5173,https://api.cron-job.org,https://cron-job.org"
```

**Ou no arquivo `.env`:**
```env
CORS_ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173,https://api.cron-job.org,https://cron-job.org
```

---

## 4. User-Agent do cron-job.org

O cron-job.org identifica suas requisições com um User-Agent específico:

```
cron-job.org - https://cron-job.org
```

### 4.1. Validação Adicional (Opcional)

Se quiser validar que a requisição vem realmente do cron-job.org, adicione esta função:

**Arquivo**: `soclt-main/reference/original-backend/api/automation.py`

```python
def _validate_cron_user_agent(user_agent: str | None) -> bool:
    """Valida se o User-Agent é do cron-job.org."""
    if not user_agent:
        return False
    return "cron-job.org" in user_agent.lower()
```

E modifique a função `_cron_auth`:

```python
def _cron_auth(authorization: str | None, user_agent: str | None = None) -> None:
    expected = os.getenv("CRON_SECRET")
    if not expected:
        raise HTTPException(status_code=503, detail="CRON_SECRET não configurado")
    if authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Não autorizado")
    
    # Validação adicional de User-Agent (opcional)
    if user_agent and not _validate_cron_user_agent(user_agent):
        raise HTTPException(status_code=403, detail="User-Agent não autorizado")
```

E atualize os endpoints:

```python
@router.get("/automation/run")
async def run_scheduled_automation(
    authorization: str | None = Header(default=None),
    user_agent: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    _cron_auth(authorization, user_agent)
    # ... resto do código
```

---

## 5. Configuração no cron-job.org

### 5.1. Criar um Novo Cron Job

1. Acesse: https://console.cron-job.org/
2. Clique em **"Create cronjob"**

### 5.2. Configurações Básicas

| Campo | Valor |
|-------|-------|
| **Title** | LomusTrack - Automação Principal |
| **URL** | `https://seu-dominio.com/api/automation/run` |
| **Schedule** | Every 10 minutes (`*/10 * * * *`) |

### 5.3. Request Settings

| Campo | Valor |
|-------|-------|
| **Request method** | GET |
| **Request timeout** | 60 segundos |

### 5.4. Headers (Obrigatório)

Adicione o header de autenticação:

```
Authorization: Bearer seu-token-secreto-aqui-123456
```

**Passos:**
1. Clique em **"+ Add header"**
2. **Name**: `Authorization`
3. **Value**: `Bearer seu-token-secreto-aqui-123456` (use o mesmo valor de `CRON_SECRET`)

### 5.5. Notifications (Recomendado)

Configure notificações para erros:

- ✅ **On failure** (quando retornar status code 4xx ou 5xx)
- ✅ **On success after failure** (quando voltar a funcionar)
- ❌ **On success** (desligado para evitar spam)

---

## 6. Endpoints Disponíveis

O backend LomusTrack tem 3 endpoints de automação:

### 6.1. Endpoint Principal (Recomendado)
```
GET /api/automation/run
```
**Executa:**
- Regras de campanha
- Envio de relatórios agendados
- Retry de notificações pendentes

**Uso no cron-job.org**: ✅ **Este é o endpoint que você deve usar**

---

### 6.2. Apenas Regras de Campanha
```
GET /api/automation/rules/run
```
**Executa:**
- Regras de campanha
- Retry de notificações

---

### 6.3. Apenas Relatórios
```
GET /api/automation/reports/run
```
**Executa:**
- Envio de relatórios agendados

---

## 7. Teste da Configuração

### 7.1. Teste Manual com curl

```bash
curl -X GET \
  https://seu-dominio.com/api/automation/run \
  -H "Authorization: Bearer seu-token-secreto-aqui-123456" \
  -H "User-Agent: cron-job.org - https://cron-job.org"
```

**Resposta esperada (sucesso):**
```json
{
  "ok": true,
  "rules_checked": 5,
  "actions_executed": 2,
  "errors": 0,
  "notification_jobs_retried": 0,
  "notification_deliveries_sent": 0,
  "notification_jobs_failed": 0,
  "reports_sent": 3,
  "reports_failed": 0
}
```

### 7.2. Teste no cron-job.org

Após criar o cron job:
1. Clique no job criado
2. Clique em **"Run now"** (botão de play)
3. Verifique o **"Execution history"**
4. Status esperado: **200 OK**

---

## 8. Troubleshooting

### 8.1. Erro 401 Unauthorized

**Causa**: Token `CRON_SECRET` incorreto ou ausente

**Solução**:
- Verifique se a variável de ambiente `CRON_SECRET` está definida no servidor
- Confirme que o header no cron-job.org tem exatamente: `Bearer {token}`
- Reinicie o servidor após definir a variável

---

### 8.2. Erro 403 Forbidden

**Causa**: User-Agent bloqueado (se implementou validação adicional)

**Solução**:
- Remova a validação de User-Agent
- Ou configure o cron-job.org para enviar o User-Agent correto

---

### 8.3. Erro 503 Service Unavailable

**Causa**: `CRON_SECRET` não configurado no servidor

**Solução**:
```bash
export CRON_SECRET="seu-token-secreto-aqui-123456"
```

---

### 8.4. Erro CORS

**Sintomas**: 
- Status 0 ou erro de CORS no log do cron-job.org
- Requisição bloqueada antes de chegar ao endpoint

**Solução**:
1. Adicione os domínios do cron-job.org ao `CORS_ALLOWED_ORIGINS`:
   ```bash
   export CORS_ALLOWED_ORIGINS="https://api.cron-job.org,https://cron-job.org"
   ```

2. Ou desabilite CORS completamente (não recomendado):
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],  # Permite todos os origins
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

---

### 8.5. Erro 409 Conflict

**Mensagem**: "A automação anterior ainda está em execução"

**Causa**: Uma execução anterior está travada há mais de 45 minutos

**Solução automática**: 
- O lock expira após 45 minutos
- A próxima execução vai sobrescrever o lock

**Solução manual** (se urgente):
```sql
DELETE FROM automation_locks WHERE lock_key = 712034;
```

---

## 9. Monitoramento

### 9.1. Logs do cron-job.org

No painel do cron-job.org:
- **Execution history**: últimas 100 execuções
- **Status codes**: 200 = sucesso, 4xx/5xx = erro
- **Response time**: tempo de resposta do servidor

### 9.2. Logs do Backend

Verifique os logs do seu servidor para ver:
- Regras executadas
- Relatórios enviados
- Erros durante a execução

---

## 10. Checklist de Deploy

Antes de colocar em produção:

- [ ] Variável `CRON_SECRET` definida no servidor
- [ ] Variável `CORS_ALLOWED_ORIGINS` inclui cron-job.org
- [ ] Backend deployado e rodando
- [ ] Cron job criado no cron-job.org
- [ ] Header `Authorization` configurado corretamente
- [ ] Teste manual executado com sucesso
- [ ] Primeira execução automática funcionou (aguarde 10 minutos)
- [ ] Notificações de erro configuradas no cron-job.org

---

## 11. Configuração de Produção Recomendada

### Variáveis de Ambiente:

```bash
# Obrigatório
export CRON_SECRET="Token_Secreto_Muito_Forte_123456789"

# CORS - inclua seu domínio + cron-job.org
export CORS_ALLOWED_ORIGINS="https://lomustrack.online,https://api.cron-job.org,https://cron-job.org"

# OpenRouter (para relatórios AI)
export OPENROUTER_API_KEY="sk-or-v1-..."
```

### No cron-job.org:

```
Title: LomusTrack - Automação
URL: https://lomustrack.online/api/automation/run
Schedule: */10 * * * *
Headers:
  Authorization: Bearer Token_Secreto_Muito_Forte_123456789
```

---

## 12. Recursos Adicionais

- **Documentação oficial**: https://cron-job.org/en/documentation/
- **Status do serviço**: https://status.cron-job.org/
- **Suporte**: support@cron-job.org

---

## Resumo

✅ **O que você precisa fazer:**

1. Definir `CRON_SECRET` no servidor
2. Adicionar `https://api.cron-job.org` ao `CORS_ALLOWED_ORIGINS`
3. Criar cron job no cron-job.org com header `Authorization: Bearer {token}`
4. Testar e monitorar

🎯 **Resultado esperado:**
- Automação rodando a cada 10 minutos
- Regras de campanha executadas automaticamente
- Relatórios enviados nos horários configurados (08:00, 12:00, 18:00, 23:00 UTC)
- Zero intervenção manual necessária
