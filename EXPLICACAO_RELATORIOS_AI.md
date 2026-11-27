# ⚠️ Por Que a IA Gera Relatórios "Falsos"?

## 🔍 O que Está Acontecendo?

A IA do LomusTrack **NÃO** está programada para inventar dados. O que acontece:

### 1. Backend Coleta Dados Reais
```python
# Arquivo: ai/daily_report_data.py
def collect_daily_data(db: Session, company_id: int) -> dict:
    # Busca vendas do banco de dados
    # Busca campanhas do Facebook Ads
    # Calcula KPIs (ROAS, CPA, lucro, etc)
```

### 2. Se Não Houver Dados
Quando você ainda não tem:
- ❌ Vendas registradas no banco
- ❌ Conta do Facebook Ads conectada
- ❌ Campanhas rodando

O backend retorna:
```json
{
  "today_kpis": {
    "total_revenue": 0,
    "total_spend": 0,
    "profit": 0,
    "roas": 0,
    "total_sales": 0
  },
  "campaigns_text": "Sem dados de campanhas hoje."
}
```

### 3. IA Recebe Dados Vazios
A IA (OpenRouter/ChatGPT) recebe esse contexto vazio e:
- **Pode "alucinar"** (LLMs fazem isso quando não têm dados)
- **Pode gerar exemplos** para mostrar como seria o relatório
- **Pode usar conhecimento prévio** sobre marketing digital

---

## 🎯 Por Que Isso Acontece?

### A IA é um LLM (Large Language Model)
Modelos como GPT-4 são treinados para **gerar texto coerente**. Quando você pede:

> "Gere um relatório diário com os dados abaixo"

E os dados estão **vazios**, a IA tem 2 opções:
1. ✅ Dizer: "Não há dados hoje"
2. ❌ Gerar um relatório "exemplo" (alucinação)

Como o prompt pede para "gerar o relatório", a IA escolhe a opção 2.

---

## ✅ Como Corrigir?

### Solução 1: Adicionar Validação no Backend ⭐ Recomendado

Modificar o endpoint para retornar mensagem quando não houver dados:

**Arquivo**: `reference/original-backend/api/gemini/daily_report.py`

```python
@router.post("/daily-report", response_model=DailyReportResponse)
async def generate_daily_report(
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    # ... código existente ...
    
    # Coletar dados
    data = collect_daily_data(db, company_id=company_id)
    
    # ✅ ADICIONAR ESTA VALIDAÇÃO:
    if data["total_spend_today"] == 0 and data["today_kpis"]["total_sales"] == 0:
        return DailyReportResponse(
            response=(
                "📊 **Relatório Diário**\n\n"
                "Ainda não há dados para hoje. Para começar:\n\n"
                "1. ✅ Conecte sua conta do Facebook Ads em **Configurações → Integrações**\n"
                "2. ✅ Importe ou registre vendas no sistema\n"
                "3. ✅ Configure suas campanhas\n\n"
                "Depois que houver dados, eu vou gerar relatórios automáticos com análises reais! 🚀"
            ),
            spend_today=0,
        )
    
    # ... resto do código ...
```

---

### Solução 2: Melhorar o Prompt da IA

**Arquivo**: `reference/original-backend/ai/prompt.py`

Adicionar no `DAILY_REPORT_PROMPT`:

```python
DAILY_REPORT_PROMPT = """...

## REGRA CRÍTICA — SEM DADOS:
Se os dados fornecidos estiverem TODOS zerados ou sem campanhas:
- NÃO invente números
- NÃO crie exemplos fictícios
- Responda: "Ainda não há dados suficientes para gerar o relatório. Conecte sua conta do Facebook Ads e registre vendas no sistema."

NUNCA INVENTE:
- Nomes de campanhas (ex: "Mentoria Premium", "Lançamento VIP")
- Valores de faturamento, gastos ou ROAS
- Recomendações baseadas em dados inexistentes

Se houver dados zerados, seja honesto e diga que não há dados hoje.

...
"""
```

---

### Solução 3: Adicionar Dados de Exemplo/Demo

Se você quiser manter relatórios "exemplo" para demonstração:

**Arquivo**: `reference/original-backend/ai/daily_report_data.py`

```python
def collect_daily_data(db: Session, company_id: int) -> dict:
    # ... código existente ...
    
    # ✅ MODO DEMO (opcional - para demonstração):
    if os.getenv("DEMO_MODE") == "true":
        return {
            "today_kpis": {
                "total_revenue": 4890,
                "total_spend": 1580,
                "profit": 3310,
                "roas": 3.09,
                "cpa": 41,
                "total_sales": 38,
                "average_ticket": 128.68,
            },
            "campaigns_text": "[DEMO] Mentoria Premium | ROAS: 4.1x | CPA: R$ 35",
            "demo_mode": True,
        }
    
    # ... resto do código normal ...
```

E no prompt:

```python
if data.get("demo_mode"):
    context += "\n\n⚠️ ATENÇÃO: Você está no MODO DEMO. Deixe claro ao usuário que estes são dados de demonstração."
```

---

## 🔍 Como Verificar se Há Dados Reais?

### No Banco de Dados:

```sql
-- Ver vendas de hoje
SELECT COUNT(*), SUM(amount) 
FROM transactions 
WHERE company_id = 1 
  AND created_at >= CURRENT_DATE;

-- Ver contas Facebook conectadas
SELECT name, account_id, token_valid 
FROM facebook_accounts 
WHERE company_id = 1;

-- Ver gastos de hoje
SELECT SUM(spend) 
FROM campaigns 
WHERE company_id = 1 
  AND date >= CURRENT_DATE;
```

**Se retornar 0 em tudo** → Por isso a IA gera relatórios fictícios

---

## 📊 Fluxo Correto dos Dados

```
1. VENDAS → Webhook recebe → Salva no transactions
                                      ↓
2. FACEBOOK ADS → API Meta → Busca campanhas/métricas
                                      ↓
3. BACKEND → Coleta tudo → Calcula KPIs
                                      ↓
4. IA → Recebe dados REAIS → Gera relatório
```

**Se qualquer etapa falhar** → IA recebe dados vazios → Pode "alucinar"

---

## ✅ Recomendação Final

**Implemente a Solução 1** (validação no backend):

1. Vou criar o código corrigido
2. Você faz o commit
3. Deploy do backend
4. Relatórios vão dizer "Sem dados" quando não houver dados reais
5. Quando conectar Facebook Ads e tiver vendas → Relatórios reais!

---

## 🎯 Próximos Passos

Para ter relatórios REAIS:

1. **Conectar Facebook Ads**
   - Ir em Configurações → Integrações
   - Conectar conta do Facebook Business
   - Autorizar acesso às campanhas

2. **Registrar Vendas**
   - Configurar webhook (se usa Kiwify, Perfectpay, etc)
   - Ou importar vendas manualmente via CSV
   - Ou registrar vendas pela API

3. **Aguardar Dados**
   - Depois que houver vendas + campanhas rodando
   - A IA vai gerar relatórios 100% reais
   - Com nomes reais de campanhas
   - Com valores reais de ROAS, CPA, etc

---

## 🔧 Quer que Eu Corrija o Código?

Posso implementar a **Solução 1** agora:
- Adicionar validação no backend
- Retornar mensagem "Sem dados" quando apropriado
- Melhorar o prompt para evitar alucinações

**Deseja que eu faça isso?** (vai levar 5 minutos)
