# 🚀 Guia Completo: Configuração de Automação no LomusTrack

Este é o **guia definitivo** para configurar automação completa no LomusTrack, incluindo regras de campanhas e relatórios de notificação usando **cron-job.org**.

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Parte 1: Configurar Backend](#parte-1-configurar-backend)
4. [Parte 2: Configurar Cron Jobs](#parte-2-configurar-cron-jobs)
5. [Parte 3: Configurar Regras de Campanhas](#parte-3-configurar-regras-de-campanhas)
6. [Parte 4: Configurar Relatórios de Notificação](#parte-4-configurar-relatórios-de-notificação)
7. [Parte 5: Testar e Monitorar](#parte-5-testar-e-monitorar)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## 📖 Visão Geral

### **O Que Será Configurado:**

```
┌─────────────────────────────────────────────────────────────────┐
│                      SISTEMA DE AUTOMAÇÃO                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🤖 REGRAS DE CAMPANHAS (Verificação a cada 10 minutos)       │
│  ├─ Pausar campanhas com CPA alto                             │
│  ├─ Ativar campanhas com ROAS bom                             │
│  ├─ Aumentar budget de campanhas lucrativas                   │
│  └─ Diminuir budget de campanhas com performance baixa        │
│                                                                 │
│  📊 RELATÓRIOS PUSH (Horários escolhidos pelo usuário)        │
│  ├─ Relatório às 08:00 (10:00 Maputo)                         │
│  ├─ Relatório às 12:00 (14:00 Maputo)                         │
│  ├─ Relatório às 18:00 (20:00 Maputo)                         │
│  └─ Relatório às 23:00 (01:00 Maputo)                         │
│                                                                 │
│  🔄 PROCESSAMENTO AUTOMÁTICO                                   │
│  └─ Retry de notificações falhadas                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Resultado Final:**

✅ Campanhas gerenciadas automaticamente 24/7  
✅ Relatórios diários no celular/navegador  
✅ Sem necessidade de intervenção manual  
✅ Economia de tempo e dinheiro  

---

## 🎯 Pré-requisitos

Antes de começar, você precisa ter:

### **1. Backend Deployado**
- ✅ Backend rodando em: `https://www.lomustrack.online/api`
- ✅ Banco de dados PostgreSQL configurado
- ✅ Endpoints de automação acessíveis

### **2. Contas Necessárias**
- ✅ Conta no LomusTrack (admin/owner)
- ✅ Conta no [cron-job.org](https://console.cron-job.org/) (gratuita e ilimitada)
- ✅ Conta de Facebook Ads conectada no LomusTrack
- ✅ Conta OpenRouter (para IA) - opcional, mas recomendado

### **3. Plano do LomusTrack**
- ⚠️ **Regras de Campanhas:** Apenas planos **Premium** ou **Monster**
- ✅ **Relatórios Push:** Todos os planos (incluindo Free)

### **4. Conhecimento Básico**
- ✅ Saber acessar painel de hospedagem (Vercel/Render/etc)
- ✅ Saber configurar variáveis de ambiente
- ✅ Noções básicas de cron expressions (vamos ensinar)

---

## 🔧 Parte 1: Configurar Backend

### **Passo 1.1: Gerar Token de Segurança**

Você precisa criar um token forte para proteger os endpoints de automação.

#### **Opção A: Gerar no PowerShell (Windows)**

Abra o PowerShell e execute:

```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

#### **Opção B: Gerar Online**

1. Acesse: https://www.random.org/strings/
2. Configure:
   - Number of strings: `1`
   - Length: `32`
   - Character set: `Alphanumeric`
3. Clique em "Get Strings"

**Exemplo de token gerado:**
```
K8mP2nQ9xR4tY7wZ3vB6cD1fG5hJ0lN4
```

⚠️ **IMPORTANTE:** Guarde esse token! Você vai usar em 2 lugares.

---

### **Passo 1.2: Configurar Variáveis de Ambiente**

Acesse o painel da sua hospedagem (Vercel, Render, Railway, etc) e adicione as seguintes variáveis:

#### **Variáveis Obrigatórias:**

```env
# Token de segurança do cron job
CRON_SECRET=K8mP2nQ9xR4tY7wZ3vB6cD1fG5hJ0lN4

# Banco de dados
DATABASE_URL=postgresql://user:password@host:5432/database

# Chave secreta para JWT
SECRET_KEY=sua_chave_secreta_aqui
```

#### **Variáveis Opcionais (mas recomendadas):**

```env
# OpenRouter (IA para gerar relatórios)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Se não configurar, relatórios não serão gerados
```

---

### **Passo 1.3: Redeploy do Backend**

Após adicionar as variáveis:

1. **No Vercel:** Deploy automático após salvar
2. **No Render:** Clique em "Manual Deploy" → "Deploy latest commit"
3. **No Railway:** Deploy automático

Aguarde o deploy finalizar (geralmente 1-3 minutos).

---

### **Passo 1.4: Testar Backend**

Teste se o backend está respondendo:

```powershell
$headers = @{ "Authorization" = "Bearer K8mP2nQ9xR4tY7wZ3vB6cD1fG5hJ0lN4" }
Invoke-WebRequest -Uri "https://www.lomustrack.online/api/automation/run" -Method GET -Headers $headers
```

**Resposta esperada:**
```
StatusCode: 200
Content: {"ok":true,"rules_checked":0,"actions_executed":0,...}
```

✅ Se viu status `200`, o backend está pronto!

---

## ⏰ Parte 2: Configurar Cron Jobs

### **Passo 2.1: Criar Conta no cron-job.org**

1. Acesse: https://console.cron-job.org/
2. Clique em **"Sign Up"**
3. Preencha:
   - Email
   - Senha
   - Confirme o email

---

### **Passo 2.2: Criar Cron Job para Regras (A cada 10 minutos)**

1. Faça login no cron-job.org
2. Clique em **"Create cronjob"**
3. Preencha:

#### **Dados Básicos:**

| Campo | Valor |
|-------|-------|
| **Title** | `LomusTrack - Regras de Campanhas` |
| **Address (URL)** | `https://www.lomustrack.online/api/automation/run` |

#### **Schedule (Agendamento):**

**Opção A: Usar interface visual**
- Minutes: `*/10`
- Hours: `*`
- Days: `*`
- Months: `*`
- Weekdays: `*`

**Opção B: Usar cron expression**
- Marque **"Custom"**
- Digite: `  `

#### **Request Settings:**

| Campo | Valor |
|-------|-------|
| **Request method** | `GET` |
| **Request timeout** | `60 seconds` |

#### **Custom Request Headers:**

1. Clique em **"Extended"** ou **"Advanced"**
2. Encontre **"Custom request headers"**
3. Preencha:

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer K8mP2nQ9xR4tY7wZ3vB6cD1fG5hJ0lN4` |

4. Clique em **"+ ADD"**

#### **Notifications (Opcional):**

- ☑️ Enable failure notifications
- Send email after: `3 consecutive failures`

5. Clique em **"Save"** ou **"Create"**

✅ **Cron Job 1 criado!** Executará a cada 10 minutos.

---

### **Passo 2.3: Criar Cron Job para Relatórios (A cada hora)**

**Este passo é opcional mas recomendado.**

1. Clique em **"Create cronjob"** novamente
2. Preencha:

#### **Dados Básicos:**

| Campo | Valor |
|-------|-------|
| **Title** | `LomusTrack - Relatórios e Notificações` |
| **Address (URL)** | `https://www.lomustrack.online/api/automation/reports/run` |

#### **Schedule:**

**Opção A: Usar interface visual**
- Marque **"Every hour"**
- Minutes: `0`
- Hours: `*/1`

**Opção B: Usar cron expression**
- Digite: `0 */1 * * *`

#### **Request Settings e Headers:**

Use os mesmos valores do Cron Job 1:
- Request method: `GET`
- Timeout: `60 seconds`
- Header: `Authorization: Bearer K8mP2nQ9xR4tY7wZ3vB6cD1fG5hJ0lN4`

3. Clique em **"Save"**

✅ **Cron Job 2 criado!** Executará a cada hora.

---

### **Passo 2.4: Testar Execução Manual**

1. Na lista de cron jobs, encontre **"LomusTrack - Regras de Campanhas"**
2. Clique no ícone **"▶️ Run now"**
3. Aguarde alguns segundos
4. Verifique o resultado:

**Sucesso:**
```
Status: 200 OK
Response time: 2.3s
```

**Erro:**
```
Status: 401 Unauthorized
```
👉 Verifique se o token no header está correto

---

## 🤖 Parte 3: Configurar Regras de Campanhas

### **Passo 3.1: Acessar Página de Regras**

1. Faça login no LomusTrack
2. No menu lateral, clique em **"Campanhas"**
3. Clique no botão **"Regras"** (canto superior direito)

---

### **Passo 3.2: Criar Regra de Exemplo 1 - Pausar CPA Alto**

1. Clique em **"+ Nova regra"**
2. Preencha:

#### **Configurações Básicas:**

| Campo | Valor |
|-------|-------|
| **Nome da Regra** | `Pausar CPA Alto (> 150 MT)` |
| **Produto** | `Qualquer` |
| **Contas de anúncio** | `Todas` |
| **Aplicar regra a** | `Campanhas Ativas` |
| **Filtro de nome** | `Campanhas de vendas` |

#### **Ação:**

- Escolha: **"Pausar campanha"**

#### **Condições:**

Clique em **"+ Adicionar condição"**:

| Campo | Operador | Valor | Moeda |
|-------|----------|-------|-------|
| `Gasto (CPA)` | `>` | `150` | `MZN` |

#### **Período e Frequência:**

| Campo | Valor |
|-------|-------|
| **Período** | `Hoje` |
| **Frequência** | `Diário` |
| **Limite diário** | `3` |

3. Clique em **"Salvar regra"**
4. Certifique-se de que o toggle está **ATIVADO** (verde)

✅ **Regra 1 criada!** Pausará campanhas com CPA > 150 MT.

---

### **Passo 3.3: Criar Regra de Exemplo 2 - Aumentar Budget ROAS Alto**

1. Clique em **"+ Nova regra"**
2. Preencha:

#### **Configurações Básicas:**

| Campo | Valor |
|-------|-------|
| **Nome da Regra** | `Aumentar Budget - ROAS > 4` |
| **Produto** | `Qualquer` |
| **Contas de anúncio** | `Todas` |
| **Aplicar regra a** | `Campanhas Ativas` |
| **Filtro de nome** | `Qualquer` |

#### **Ação:**

- Escolha: **"Aumentar orçamento"**
- Valor: `20%`

#### **Condições:**

Adicione 2 condições:

| Campo | Operador | Valor |
|-------|----------|-------|
| `ROAS` | `>` | `4.0` |
| `Vendas` | `>` | `10` |

#### **Período e Frequência:**

| Campo | Valor |
|-------|-------|
| **Período** | `Últimos 7 dias` |
| **Frequência** | `Diário` |
| **Limite diário** | `2` |

3. Clique em **"Salvar regra"**
4. Ative a regra (toggle verde)

✅ **Regra 2 criada!** Aumentará budget de campanhas lucrativas.

---

### **Passo 3.4: Mais Exemplos de Regras Úteis**

#### **Regra 3: Reativar Campanhas com Bom Desempenho**

```yaml
Nome: Reativar ROAS > 3
Ação: Ativar campanha
Condições:
  - ROAS > 3.0
  - CTR > 1.5%
Período: Ontem
Limite: 1 campanha/dia
```

#### **Regra 4: Diminuir Budget - Performance Baixa**

```yaml
Nome: Diminuir Budget - CTR < 1%
Ação: Diminuir orçamento (10%)
Condições:
  - CTR < 1.0%
  - Gasto > 100 MZN
Período: Hoje
Limite: 2 campanhas/dia
```

---

## 📊 Parte 4: Configurar Relatórios de Notificação

### **Passo 4.1: Habilitar Push Notifications**

1. No menu lateral, clique em **"Configurações"**
2. Clique em **"Notificações"**

---

### **Passo 4.2: Escolher Horários**

Na seção **"Horários"**, ative os horários desejados:

#### **Recomendação para Iniciantes:**

```
☑️ Notificação das 08:00  (Relatório da manhã - 10:00 Maputo)
⬜ Notificação das 12:00
⬜ Notificação das 18:00
⬜ Notificação das 23:00
```

#### **Para Usuários Avançados:**

```
☑️ Notificação das 08:00  (Manhã)
☑️ Notificação das 12:00  (Almoço)
☑️ Notificação das 18:00  (Tarde)
☑️ Notificação das 23:00  (Resumo do dia)
```

**As configurações são salvas automaticamente!**

---

### **Passo 4.3: Escolher Formato do Relatório**

Escolha 1 dos 3 formatos:

#### **Opção 1: Status de Lucro (Recomendado)**

✅ Foco em faturamento, ROAS, lucro líquido  
✅ Formato objetivo e direto  
✅ Ideal para análise rápida  

**Exemplo:**
```
Seu resumo de lucro de hoje está pronto!

Faturamento Líquido: 9.750 MT
Gastos com Anúncios: 3.200 MT
ROAS: 3.05
Lucro Líquido: 6.550 MT
```

#### **Opção 2: Resumo Detalhado**

✅ Análise completa de campanhas  
✅ Alertas e recomendações  
✅ Mais informações  

**Exemplo:**
```
RESUMO DETALHADO DA OPERAÇÃO

Faturamento: 9.750 MT
Investimento: 3.200 MT
ROI: 205%
ROAS: 3.05

Campanha "Black Friday": 20 vendas - Líder!
Alerta: "Remarketing" com CPA alto (180 MT)
```

#### **Opção 3: Notificações Criativas**

✅ Mensagens bem-humoradas  
✅ Sempre diferentes  
✅ Mais envolvente  

**Exemplo:**
```
🎉 Hoje foi dia de faturar!

45 vendas = 9.750 MT no bolso!
Meta Ads comeu 3.200 MT
Lucro real: 6.550 MT

Campanha "Black Friday" tá voando! 🚀
```

---

### **Passo 4.4: Inscrever Dispositivos**

Para receber as notificações, você precisa inscrever dispositivos.

#### **No Navegador (Desktop/Mobile):**

1. Acesse LomusTrack pelo navegador
2. Quando aparecer a pergunta "Permitir notificações?", clique em **"Permitir"**
3. ✅ Dispositivo inscrito!

#### **PWA (App Instalado):**

1. No navegador Chrome/Edge, clique nos 3 pontinhos
2. Clique em **"Instalar LomusTrack"** ou **"Adicionar à tela inicial"**
3. Abra o app instalado
4. Aceite as permissões de notificação
5. ✅ App inscrito!

---

### **Passo 4.5: Testar Envio Manual**

1. Na página de **Configurações** → **Notificações**
2. Procure o botão **"Enviar teste"** (se disponível)
3. Clique e aguarde
4. Verifique se recebeu a notificação no navegador/app

---

## 🧪 Parte 5: Testar e Monitorar

### **Passo 5.1: Verificar Primeira Execução do Cron**

Aguarde até o próximo múltiplo de 10 minutos (ex: 14:10, 14:20, 14:30...).

#### **No cron-job.org:**

1. Vá para a lista de cron jobs
2. Clique em **"LomusTrack - Regras de Campanhas"**
3. Vá para a aba **"History"**
4. Verifique a última execução:

**Sucesso:**
```
✅ 2024-11-22 14:10:00 - 200 OK - 2.3s
```

**Erro:**
```
❌ 2024-11-22 14:10:00 - 401 Unauthorized
```

---

### **Passo 5.2: Monitorar Regras no LomusTrack**

1. Acesse **Campanhas** → **Regras**
2. Veja a lista de regras
3. Verifique:
   - **Última execução:** Data e hora da última verificação
   - **Ações hoje:** Quantas ações foram executadas hoje
   - **Status:** Se há erros

---

### **Passo 5.3: Ver Histórico de Ações**

1. Acesse **Operações** → **Histórico de Ações**
2. Filtre por:
   - Data
   - Tipo de ação (pause, activate, budget)
   - Campanha
3. Veja detalhes de cada ação executada

---

### **Passo 5.4: Verificar Relatórios Enviados**

1. Acesse **Configurações** → **Notificações** → **Histórico**
2. Veja:
   - Data e hora do envio
   - Status (sent, failed, no_subscribers)
   - Número de dispositivos que receberam
   - Prévia do conteúdo

---

## 🆘 Troubleshooting

### **Problema 1: Cron Job Retorna 401 Unauthorized**

**Causa:** Token de autorização incorreto.

**Solução:**
1. Verifique se o token no header do cron job é exatamente o mesmo configurado em `CRON_SECRET`
2. Não pode ter espaços antes ou depois
3. Deve incluir "Bearer " antes do token
4. Backend precisa ter feito redeploy após adicionar a variável

---

### **Problema 2: Regras Não Estão Sendo Executadas**

**Possíveis causas:**
- Regra está desativada (toggle OFF)
- Já atingiu o limite diário
- Não há campanhas que atendem as condições
- Token do Meta Ads expirado

**Soluções:**
1. Verifique se a regra está ativada (toggle verde)
2. Verifique o campo "Ações hoje" (se atingiu o limite, aguarde amanhã)
3. Teste manualmente se há campanhas que atendem as condições
4. Reautentique a conta de Facebook Ads

---

### **Problema 3: Relatórios Não Estão Sendo Enviados**

**Possíveis causas:**
- Nenhum dispositivo inscrito
- `OPENROUTER_API_KEY` não configurada
- Horário de envio não configurado

**Soluções:**
1. Inscreva pelo menos 1 dispositivo
2. Configure `OPENROUTER_API_KEY` no backend
3. Ative pelo menos 1 horário em Configurações → Notificações

---

### **Problema 4: Ações Não Estão Sendo Aplicadas nas Campanhas**

**Possíveis causas:**
- Token do Meta Ads expirado
- Campanha já está no estado desejado
- Permissões insuficientes no Meta

**Soluções:**
1. Vá em **Plataformas** → **Credenciais**
2. Reautentique a conta de Facebook Ads
3. Verifique se a conta tem permissão `ads_management`
4. Verifique os logs de erro na regra

---

### **Problema 5: Cron Job Não Está Executando**

**Possíveis causas:**
- Cron job está desativado
- Horário configurado incorretamente
- Conta suspensa no cron-job.org

**Soluções:**
1. Verifique se o toggle do cron job está **ATIVADO** (verde)
2. Verifique a cron expression (use https://crontab.guru/)
3. Teste com "Run now" para ver se executa manualmente
4. Verifique seu email por notificações do cron-job.org

---

## ❓ FAQ (Perguntas Frequentes)

### **1. Quanto custa usar o cron-job.org?**

✅ **100% Gratuito!** O serviço é totalmente grátis e inclui:
- **Cron jobs ilimitados** (dentro do uso justo)
- Frequência mínima de **1 minuto**
- Notificações por email
- Histórico de 7 dias
- 100 chamadas à API REST/dia

**Uso justo significa:**
- Uso normal de automação é totalmente permitido
- Não usar para atividades abusivas
- Para o LomusTrack, 2-3 cron jobs são perfeitos!

---

### **2. Posso usar menos de 2 cron jobs?**

✅ **Sim!** Use apenas 1 cron job:
- Configure para executar **a cada 10 minutos** (`*/10 * * * *`)
- Use o endpoint `/automation/run`
- Verificará regras e relatórios na mesma execução

**Ou use até 10+ cron jobs se precisar!** O cron-job.org não tem limite (uso justo).

---

### **3. Quanto custa a API da OpenRouter?**

Depende do modelo:
- **Claude 3.5 Sonnet:** ~$3.00 por milhão de tokens de entrada
- **Claude 3.5 Haiku:** ~$0.80 por milhão de tokens
- **GPT-4o mini:** ~$0.15 por milhão de tokens

**Estimativa para relatórios diários:**
- 1 relatório/dia = ~500 tokens
- 30 dias × 500 tokens = 15.000 tokens/mês
- Custo mensal: **~$0.045 (menos de 5 centavos USD)**

---

### **4. Posso ter regras diferentes para cada produto?**

✅ **Sim!** Ao criar uma regra, escolha o produto específico no campo "Produto".

---

### **5. Quantas regras posso criar?**

✅ **Ilimitadas!** Desde que esteja em um plano pago (Premium ou Monster).

---

### **6. As regras funcionam 24/7?**

✅ **Sim!** Desde que:
- Cron job esteja ativo
- Regras estejam ativadas
- Token do Meta Ads válido

---

### **7. Posso pausar as regras temporariamente?**

✅ **Sim!** Basta desativar o toggle da regra (cinza).

---

### **8. Os relatórios funcionam offline?**

❌ **Não.** Você precisa estar com internet para receber push notifications.

---

### **9. Posso receber relatórios em múltiplos dispositivos?**

✅ **Sim!** Basta inscrever cada dispositivo:
- Celular
- Tablet
- Computador (navegador)
- Múltiplos navegadores

Todos receberão as notificações!

---

### **10. Como cancelo as notificações?**

#### **No Navegador:**
1. Clique no cadeado (URL bar)
2. Vá em "Permissões"
3. Desative "Notificações"

#### **No LomusTrack:**
1. Configurações → Notificações
2. Desative todos os horários

---

### **11. Qual é o limite de cron jobs que posso criar?**

✅ **Ilimitado!** O cron-job.org não limita o número de cron jobs por conta.

**Política de uso justo:**
- Você pode criar quantos precisar para automação normal
- Para o LomusTrack, 2-3 cron jobs são perfeitos
- Não use para spam ou atividades abusivas
- Não sobrecarregue o serviço com milhares de jobs

**Exemplo aceitável:**
- 1 job para regras (*/10 * * * *)
- 1 job para relatórios (0 */1 * * *)
- 1 job para backup (0 2 * * *)
- 1 job para limpeza (0 3 * * *)
- **Total: 4 jobs = ✅ Totalmente OK!**

---

### **12. Posso executar cron jobs a cada 1 minuto?**

✅ **Sim!** A frequência mínima é **1 minuto** (60x por hora).

**Recomendação para LomusTrack:**
- **Regras:** 10 minutos é o ideal (não precisa de 1 min)
- **Relatórios:** 1 hora é suficiente
- **1 minuto seria excessivo** e desnecessário

---

## ✅ Checklist Final de Configuração

Antes de considerar tudo pronto, verifique:

### **Backend:**
- [ ] Variável `CRON_SECRET` configurada
- [ ] Variável `OPENROUTER_API_KEY` configurada (opcional)
- [ ] Backend deployado e acessível
- [ ] Teste manual do endpoint retornou status 200

### **cron-job.org:**
- [ ] Conta criada e email confirmado
- [ ] Cron job "Regras" criado (`*/10 * * * *`)
- [ ] Cron job "Relatórios" criado (`0 */1 * * *`) - opcional
- [ ] Header `Authorization` configurado em ambos
- [ ] Teste manual "Run now" executado com sucesso
- [ ] Primeira execução automática verificada

### **LomusTrack - Regras:**
- [ ] Pelo menos 1 conta de Facebook Ads conectada
- [ ] Token do Meta Ads válido
- [ ] Pelo menos 1 regra de campanha criada
- [ ] Regra está **ATIVADA** (toggle verde)
- [ ] Teste: aguardar 10 minutos e verificar execução

### **LomusTrack - Relatórios:**
- [ ] Pelo menos 1 horário ativado em Configurações → Notificações
- [ ] Formato de relatório escolhido
- [ ] Pelo menos 1 dispositivo inscrito para notificações
- [ ] Teste: envio manual funcionou (se disponível)

### **Monitoramento:**
- [ ] Histórico do cron-job.org mostra execuções
- [ ] Regras mostram "Última execução" atualizada
- [ ] Histórico de ações mostra ações executadas (se aplicável)
- [ ] Relatório recebido no horário configurado

---

## 🎓 Próximos Passos

Agora que tudo está configurado:

1. **Monitore por 1 semana**
   - Veja quais regras estão sendo mais acionadas
   - Ajuste limites e condições conforme necessário
   - Verifique se os relatórios estão úteis

2. **Ajuste Fino**
   - Crie regras mais específicas
   - Ajuste horários de relatórios
   - Adicione mais condições às regras

3. **Escale**
   - Adicione mais contas de anúncio
   - Crie regras diferentes para cada produto
   - Experimente diferentes formatos de relatório

---

## 📚 Documentação Adicional

- **CRON_JOBS_SETUP.md** - Detalhes técnicos do cron-job.org
- **COMO_CONFIGURAR_AUTOMACAO.md** - Exemplos de regras e casos de uso
- [Documentação Meta Ads API](https://developers.facebook.com/docs/marketing-apis/)
- [Documentação cron-job.org](https://docs.cron-job.org/)
- [Cron Expression Generator](https://crontab.guru/)

---

## 💡 Dicas Finais

✅ **Comece Simples**
- 1-2 regras básicas
- 1 horário de relatório
- Monitore por alguns dias

✅ **Ajuste Gradualmente**
- Aumente limites diários conforme confiança
- Adicione mais condições
- Experimente diferentes períodos

✅ **Monitore Sempre**
- Verifique logs semanalmente
- Ajuste regras que não estão performando
- Celebre as otimizações automáticas!

---

## 🎉 Parabéns!

Você configurou com sucesso o sistema completo de automação do LomusTrack!

Agora suas campanhas serão gerenciadas automaticamente 24/7 e você receberá relatórios diários sem precisar fazer nada manualmente.

**Próxima execução:**
- **Regras:** Próximo múltiplo de 10 minutos
- **Relatórios:** Próximo horário configurado

**Aproveite sua liberdade! 🚀**

---

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Consulte a seção [Troubleshooting](#troubleshooting)
2. Revise a seção [FAQ](#faq)
3. Entre em contato com o suporte do LomusTrack

---

**Documento criado em:** 22 de novembro de 2024  
**Versão:** 1.0  
**Autor:** Equipe LomusTrack  

---

✨ **Obrigado por usar o LomusTrack!** ✨
