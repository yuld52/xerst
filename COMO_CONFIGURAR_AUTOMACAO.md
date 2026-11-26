# 🤖 Como Configurar Automação no LomusTrack

Este guia explica **passo a passo** como configurar **regras de campanhas** e **relatórios de notificação** para funcionar automaticamente com o cron-job.org.

---

## 📋 Pré-requisitos

✅ Backend deployado em https://www.lomustrack.online/api  
✅ Cron job configurado no cron-job.org (veja `CRON_JOBS_SETUP.md`)  
✅ Conta ativa no LomusTrack  
✅ Plano **Premium ou Monster** (regras são pagas)  

---

## 🎯 Parte 1: Configurar Regras de Campanhas

As **regras de campanhas** permitem automatizar ações nas suas campanhas do Facebook/Meta Ads com base em métricas de desempenho.

### **Passo 1: Acessar a Página de Campanhas**

1. Faça login no LomusTrack
2. No menu lateral, clique em **"Campanhas"**
3. Clique no botão **"Regras"** (canto superior direito)

### **Passo 2: Criar uma Nova Regra**

Clique em **"+ Nova regra"** e preencha:

#### **Configurações Básicas:**

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **Nome da Regra** | Identificação clara | "Pausar campanhas com CPA alto" |
| **Produto** | Qual produto rastrear | "Qualquer" ou específico |
| **Contas de anúncio** | Quais contas aplicar | "Todas" |
| **Aplicar regra a** | Escopo das campanhas | "Campanhas Ativas" |
| **Filtro de nome** | Tipo de campanha | "Campanhas de vendas" |

#### **Ação a Executar:**

Escolha uma ação:

| Ação | Descrição | Quando Usar |
|------|-----------|-------------|
| **Pausar campanha** | Pausa automaticamente | CPA muito alto, orçamento estourado |
| **Ativar campanha** | Reativa automaticamente | ROAS bom, período específico |
| **Aumentar orçamento** | Incrementa % do budget | Campanha performando bem |
| **Diminuir orçamento** | Reduz % do budget | Reduzir gasto sem pausar |

#### **Condições (Métricas):**

Adicione condições que ativam a regra:

**Exemplo 1 - Pausar se CPA > 100 MT:**
```
Gasto (CPA) > 100 MZN
```

**Exemplo 2 - Ativar se ROAS > 3:**
```
ROAS > 3.0
```

**Exemplo 3 - Aumentar budget se CTR > 2% E Vendas > 5:**
```
CTR > 2.0 %
E
Vendas > 5
```

#### **Período de Análise:**

| Opção | Descrição |
|-------|-----------|
| **Hoje** | Métricas do dia atual |
| **Ontem** | Métricas do dia anterior |
| **Últimos 7 dias** | Média dos últimos 7 dias |
| **Últimos 30 dias** | Média dos últimos 30 dias |

#### **Frequência e Limites:**

| Campo | Recomendação |
|-------|--------------|
| **Frequência** | "Diário" (executado pelo cron) |
| **Limite diário** | 1-3 ações por dia (evita oscilações) |

### **Passo 3: Salvar e Ativar**

1. Clique em **"Salvar regra"**
2. Certifique-se de que o toggle está **ATIVADO** (verde)
3. A regra agora está pronta para ser executada pelo cron job!

---

## 📊 Exemplos Práticos de Regras

### **Regra 1: Pausar Campanhas com Alto CPA**

```
Nome: Pausar CPA > 150 MT
Ação: Pausar campanha
Condições:
  - Gasto (CPA) > 150 MZN
Período: Hoje
Frequência: Diário
Limite: 3 campanhas/dia
```

**Resultado:** Se uma campanha ativa tiver CPA acima de 150 MT hoje, ela será pausada automaticamente.

---

### **Regra 2: Aumentar Orçamento de Campanhas Lucrativas**

```
Nome: Aumentar budget - ROAS > 4
Ação: Aumentar orçamento (20%)
Condições:
  - ROAS > 4.0
  - Vendas > 10
Período: Últimos 7 dias
Frequência: Diário
Limite: 2 campanhas/dia
```

**Resultado:** Campanhas com ROAS > 4 e mais de 10 vendas nos últimos 7 dias terão o orçamento aumentado em 20%.

---

### **Regra 3: Reativar Campanhas com Bom Desempenho**

```
Nome: Reativar ROAS > 3
Ação: Ativar campanha
Condições:
  - ROAS > 3.0
  - CTR > 1.5 %
Período: Ontem
Frequência: Diário
Limite: 1 campanha/dia
```

**Resultado:** Campanhas pausadas que tiveram bom desempenho ontem serão reativadas.

---

## 🔔 Parte 2: Configurar Relatórios de Notificação Push

Os **relatórios push** enviam notificações diárias no celular/navegador com resumo das métricas.

### **Passo 1: Habilitar Push Notifications**

1. Acesse **Configurações** → **Notificações**
2. Ative **"Relatórios Diários"**
3. Escolha o horário: **08:00** (recomendado)

### **Passo 2: Escolher o Formato do Relatório**

| Formato | Descrição | Exemplo |
|---------|-----------|---------|
| **Status de Lucro** | Foco em faturamento, ROAS, lucro líquido | "Hoje: 50 vendas, 10.500 MT faturado, ROAS 3.2" |
| **Resumo Detalhado** | Análise completa de campanhas e alertas | "Campanha X: +25% vendas, Campanha Y: CPA alto" |
| **Criativo** | Mensagem bem-humorada com números reais | "🎉 Dinheiro entrando! 50 vendas = 10.5k MT. Meta Ads gastou 3.2k MT, você lucrou 7.3k MT!" |

### **Passo 3: Inscrever Dispositivos**

#### **No Navegador (Desktop/Mobile):**

1. Acesse LomusTrack pelo navegador
2. Permita notificações quando solicitado
3. O dispositivo será inscrito automaticamente

#### **PWA (Progressive Web App):**

1. No navegador, clique em **"Instalar LomusTrack"**
2. Use o app instalado
3. Aceite as permissões de notificação

### **Passo 4: Testar Envio Manual**

1. Vá em **Configurações** → **Notificações**
2. Clique em **"Enviar teste"**
3. Verifique se recebeu a notificação

---

## ⏰ Como o Cron Job Executa Tudo

Quando o **cron-job.org** chama o endpoint `/automation/run`, ele:

### **1. Verifica Regras de Campanhas Ativas**
- Busca todas as regras com `enabled: true`
- Verifica se já foram executadas hoje
- Respeita o limite diário de execuções

### **2. Coleta Métricas das Campanhas**
- Conecta nas contas de Facebook Ads
- Busca métricas do período configurado (hoje, ontem, 7d, 30d)
- Calcula: Spend, CPA, CTR, ROAS, Sales

### **3. Avalia Condições**
- Compara métricas com as condições da regra
- Exemplo: `CPA > 150` → Verdadeiro se CPA da campanha = 180

### **4. Executa Ações**
- **Pausar:** Define status da campanha como `PAUSED`
- **Ativar:** Define status como `ACTIVE`
- **Aumentar budget:** Calcula novo valor e atualiza no Meta
- **Diminuir budget:** Calcula novo valor e atualiza no Meta

### **5. Registra Logs**
- Salva na tabela `audit_log`
- Registra na tabela `campaign_action`
- Incrementa contador `executions_today`

### **6. Envia Relatórios Push**
- Verifica se há dispositivos inscritos
- Coleta dados de vendas, faturamento, ROI
- Gera texto com IA (OpenRouter)
- Envia push notification para todos os dispositivos

### **7. Retry de Notificações Falhadas**
- Busca notificações com status `failed`
- Tenta reenviar (máx 3 tentativas)
- Atualiza status conforme resultado

---

## 📊 Monitoramento de Execuções

### **Ver Histórico de Regras:**

1. Acesse **Campanhas** → **Regras**
2. Clique em uma regra para ver detalhes
3. Veja:
   - Última execução
   - Número de ações executadas hoje
   - Erros (se houver)

### **Ver Logs de Ações:**

1. Acesse **Operações** → **Histórico de Ações**
2. Filtre por:
   - Data
   - Tipo de ação (pause, activate, budget)
   - Campanha

### **Ver Relatórios Enviados:**

1. Acesse **Configurações** → **Notificações** → **Histórico**
2. Veja:
   - Data e hora do envio
   - Status (sent, failed, no_subscribers)
   - Número de dispositivos que receberam

---

## ⚙️ Configuração Avançada

### **Variáveis de Ambiente Necessárias:**

Certifique-se de que o backend tem:

```env
# Autenticação do cron job
CRON_SECRET=seu_token_secreto_aqui

# IA para gerar relatórios (OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Meta Ads (para executar ações)
# (configurado por conta no painel)
```

### **Configuração de Cron Jobs Recomendada:**

Para melhor performance, configure **2 cron jobs separados**:

#### **Cron Job 1: Verificar Regras de Campanhas (A cada 10 minutos)**

```yaml
Title: LomusTrack - Regras de Campanhas

URL: https://www.lomustrack.online/api/automation/run

Schedule: Every 10 minutes
Cron Expression: */10 * * * *

Request method: GET

Headers:
  Authorization: Bearer 92fc1f5434fe55a3a28257f96758f08a4317546187c4008723c56b853b91d18f

Timeout: 60 seconds
```

**Por quê a cada 10 minutos?**
- ✅ Resposta rápida a mudanças nas métricas
- ✅ Evita campanhas gastando por muito tempo com CPA alto
- ✅ Aproveita ROAS bom aumentando budget rapidamente
- ✅ Sem sobrecarregar o Meta Ads API

#### **Cron Job 2: Enviar Relatórios (A cada hora)**

```yaml
Title: LomusTrack - Relatórios e Notificações

URL: https://www.lomustrack.online/api/automation/reports/run

Schedule: Every hour
Cron Expression: 0 */1 * * *

Request method: GET

Headers:
  Authorization: Bearer 92fc1f5434fe55a3a28257f96758f08a4317546187c4008723c56b853b91d18f

Timeout: 60 seconds
```

**Por quê a cada hora?**
- ✅ Relatórios são enviados apenas nos horários configurados
- ✅ Economiza créditos de IA (OpenRouter)
- ✅ Evita spam de notificações

---

### **Alternativa: Um Único Cron Job (Mais Simples)**

Se preferir simplicidade, use apenas 1 cron job:

```yaml
Title: LomusTrack - Automação Completa

URL: https://www.lomustrack.online/api/automation/run

Schedule: Every 10 minutes
Cron Expression: */10 * * * *

Request method: GET

Headers:
  Authorization: Bearer 92fc1f5434fe55a3a28257f96758f08a4317546187c4008723c56b853b91d18f

Timeout: 60 seconds
```

**Resultado:**
- ✅ Verifica regras a cada 10 minutos
- ✅ Verifica relatórios a cada 10 minutos (mas só envia nos horários configurados)
- ✅ Reprocessa notificações falhadas a cada 10 minutos

---

### **Horários Recomendados:**

| Tarefa | Frequência | Cron Expression | Endpoint |
|--------|-----------|-----------------|----------|
| **Regras de Campanhas** | A cada 10 minutos | `*/10 * * * *` | `/automation/run` |
| **Relatórios Push** | A cada hora | `0 */1 * * *` | `/automation/reports/run` |
| **Retry Notificações** | A cada 30 minutos | `*/30 * * * *` | `/automation/notifications/retry` |

---

## ⚠️ Limitações e Boas Práticas

### **Limitações:**

❌ **Plano Free:** Regras de automação não estão disponíveis  
❌ **Sem credenciais Meta:** Não pode executar ações nas campanhas  
❌ **Sem dispositivos inscritos:** Relatórios não serão enviados  
❌ **Token inválido Meta:** Conta ignorada na execução  

### **Boas Práticas:**

✅ **Limite diário:** Configure 1-3 ações/dia para evitar oscilações  
✅ **Teste manual primeiro:** Verifique se as condições fazem sentido  
✅ **Monitore logs:** Acompanhe execuções nas primeiras semanas  
✅ **Use período > hoje:** Evite decisões baseadas em poucas horas de dados  
✅ **Combine condições:** Use AND para evitar ações precipitadas  

---

## 🆘 Problemas Comuns

### **1. Regras não estão sendo executadas**

**Possíveis causas:**
- Cron job não está ativo
- Regra está desativada (toggle OFF)
- Já atingiu o limite diário
- Não há campanhas que atendem as condições

**Solução:**
- Verifique o histórico do cron-job.org
- Ative a regra no painel
- Aumente o limite diário
- Revise as condições da regra

---

### **2. Relatórios não estão sendo enviados**

**Possíveis causas:**
- Nenhum dispositivo inscrito
- `OPENROUTER_API_KEY` não configurada
- Horário de envio não configurado

**Solução:**
- Inscreva dispositivos nas notificações push
- Configure a chave da OpenRouter no backend
- Ative "Relatórios Diários" nas configurações

---

### **3. Ações não estão sendo aplicadas nas campanhas**

**Possíveis causas:**
- Token do Meta Ads expirado
- Campanha já está no estado desejado (pausar → já pausada)
- Permissões insuficientes no Meta

**Solução:**
- Reautentique a conta de Facebook Ads
- Verifique os logs de erros na regra
- Conceda permissões `ads_management` no Meta

---

## 📈 Exemplo de Resultado Esperado

Após configurar tudo corretamente, você verá:

### **No Dashboard do cron-job.org:**

```
✅ LomusTrack - Automação Completa
   Last execution: 2024-11-22 08:00:00
   Status: 200 OK
   Response time: 2.3s
```

### **No Endpoint de Teste:**

```json
{
  "ok": true,
  "rules_checked": 5,
  "actions_executed": 2,
  "errors": 0,
  "notification_jobs_retried": 0,
  "notification_deliveries_sent": 10,
  "notification_jobs_failed": 0,
  "reports_sent": 3,
  "reports_failed": 0
}
```

### **No Dispositivo (Push):**

```
📊 Relatório LomusTrack 2024-11-22

Hoje: 45 vendas, 9.750 MT faturado
Investimento: 3.200 MT
ROAS: 3.05
Lucro líquido: 6.550 MT

🎉 Campanha "Black Friday" liderando com 20 vendas!
⚠️ "Remarketing": CPA subiu para 180 MT - considere pausar
```

---

## ✅ Checklist Final

Antes de considerar tudo configurado, verifique:

### **Backend:**
- [ ] `CRON_SECRET` configurado
- [ ] `OPENROUTER_API_KEY` configurado (para relatórios)
- [ ] Backend deployado e acessível

### **cron-job.org:**
- [ ] Cron job criado e ativo
- [ ] Header `Authorization` configurado
- [ ] Teste manual retornou status 200
- [ ] Histórico mostra execuções bem-sucedidas

### **LomusTrack:**
- [ ] Pelo menos 1 regra de campanha criada e ativada
- [ ] Conta de Facebook Ads conectada e com token válido
- [ ] Relatórios diários ativados nas configurações
- [ ] Pelo menos 1 dispositivo inscrito para push

### **Verificação:**
- [ ] Aguardar primeira execução automática
- [ ] Verificar logs no histórico de ações
- [ ] Confirmar recebimento de relatório push
- [ ] Monitorar por 1 semana para ajustes

---

## 🎓 Recursos Adicionais

- [Documentação Meta Ads API](https://developers.facebook.com/docs/marketing-apis/)
- [Push Notifications Web API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [OpenRouter Documentation](https://openrouter.ai/docs)

---

✅ **Pronto! Sua automação está configurada e funcionando!** 🎉

Agora o LomusTrack vai:
- ✅ Verificar regras automaticamente
- ✅ Executar ações nas campanhas
- ✅ Enviar relatórios diários
- ✅ Reprocessar notificações falhadas

Tudo isso **sem você precisar fazer nada manualmente**! 🚀
