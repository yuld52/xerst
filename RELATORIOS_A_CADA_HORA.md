# ⏰ Relatórios de Notificação a Cada Hora

## 🎯 Objetivo

Configurar o LomusTrack para enviar relatórios de notificação **a cada 1 hora** em vez de apenas em horários específicos.

---

## 🔧 Como Funciona

### Modo 1: Horários Específicos (Padrão)

**Configuração**: Marcar horários individuais (08:00, 12:00, 18:00, 23:00)

```json
{
  "reportHours": {
    "08:00": true,
    "12:00": true,
    "18:00": true,
    "23:00": true
  }
}
```

**Resultado**: Relatórios apenas nos horários marcados.

---

### Modo 2: A Cada Hora (Novo) ⭐

**Configuração**: Adicionar `"hourly": true`

```json
{
  "reportHours": {
    "hourly": true
  }
}
```

**Resultado**: Relatórios **a cada hora** (00:00, 01:00, 02:00, ..., 23:00) = **24 relatórios por dia**

---

## 📊 Como Configurar

### Opção 1: Via SQL (Direto no Banco)

```sql
-- Habilitar relatórios de hora em hora para uma empresa específica
UPDATE company_settings 
SET notification_preferences = jsonb_set(
    COALESCE(notification_preferences, '{}'::jsonb),
    '{reportHours}',
    '{"hourly": true}'::jsonb
)
WHERE company_id = 1;  -- Substitua pelo ID da empresa
```

**Para todas as empresas:**

```sql
-- Habilitar para TODAS as empresas
UPDATE company_settings 
SET notification_preferences = jsonb_set(
    COALESCE(notification_preferences, '{}'::jsonb),
    '{reportHours}',
    '{"hourly": true}'::jsonb
)
WHERE company_id IS NOT NULL;
```

---

### Opção 2: Via API (Frontend)

**Endpoint**: `PATCH /api/company/settings`

**Body**:
```json
{
  "notification_preferences": {
    "reportHours": {
      "hourly": true
    },
    "template": "summary"
  }
}
```

---

## ⚙️ Combinação de Modos

Você pode combinar ambos os modos:

```json
{
  "reportHours": {
    "hourly": true,
    "08:00": true,
    "12:00": true
  }
}
```

**Comportamento**: Como `hourly: true` está presente, envia **a cada hora** (ignora horários específicos).

---

## 🔍 Verificar Configuração Atual

```sql
-- Ver configuração de uma empresa específica
SELECT 
    company_id,
    notification_preferences->'reportHours' as report_hours
FROM company_settings
WHERE company_id = 1;  -- Substitua pelo ID da empresa
```

**Resultado esperado (modo hourly)**:
```json
{"hourly": true}
```

**Resultado esperado (modo específico)**:
```json
{"08:00": true, "12:00": true, "18:00": true, "23:00": true}
```

---

## 📈 Frequência de Execução

### Com cron-job.org a Cada 10 Minutos

| Configuração | Relatórios por Dia |
|--------------|-------------------|
| Horários específicos (4 horários) | 4 relatórios |
| `"hourly": true` | 24 relatórios |

**Importante**: Como o cron roda a **cada 10 minutos**, o sistema detecta quando uma nova hora começou e envia o relatório **uma única vez** naquela hora (evita duplicatas).

### Exemplo de Execução:

```
00:00 - Cron roda → Envia relatório "00:00"
00:10 - Cron roda → Já enviou "00:00", não envia
00:20 - Cron roda → Já enviou "00:00", não envia
00:30 - Cron roda → Já enviou "00:00", não envia
00:40 - Cron roda → Já enviou "00:00", não envia
00:50 - Cron roda → Já enviou "00:00", não envia
01:00 - Cron roda → Nova hora! Envia relatório "01:00"
01:10 - Cron roda → Já enviou "01:00", não envia
...
```

**Proteção contra duplicatas**: Usa título único por dia + hora.

---

## 🧪 Testar Modo Hourly

### 1. Habilitar para Sua Empresa

```sql
UPDATE company_settings 
SET notification_preferences = jsonb_set(
    COALESCE(notification_preferences, '{}'::jsonb),
    '{reportHours}',
    '{"hourly": true}'::jsonb
)
WHERE company_id = (SELECT id FROM companies WHERE name = 'Sua Empresa LIMIT 1');
```

### 2. Aguardar Próxima Hora Cheia

Exemplo: Se agora são 14:35, aguarde até 15:00.

### 3. Verificar Notificações Enviadas

```sql
-- Ver últimos relatórios enviados
SELECT 
    title,
    status,
    sent_count,
    created_at
FROM notification_delivery
WHERE data->>'kind' = 'scheduled_report'
  AND company_id = 1  -- Sua empresa
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado esperado**: Um novo relatório a cada hora.

---

## 🔄 Desabilitar Modo Hourly

### Voltar para Horários Específicos:

```sql
UPDATE company_settings 
SET notification_preferences = jsonb_set(
    COALESCE(notification_preferences, '{}'::jsonb),
    '{reportHours}',
    '{"08:00": true, "12:00": true, "18:00": true, "23:00": true}'::jsonb
)
WHERE company_id = 1;
```

### Desabilitar Completamente:

```sql
UPDATE company_settings 
SET notification_preferences = jsonb_set(
    COALESCE(notification_preferences, '{}'::jsonb),
    '{reportHours}',
    '{}'::jsonb
)
WHERE company_id = 1;
```

---

## 💡 Recomendações

### Para Empresas Pequenas/Médias:
✅ **Usar horários específicos** (4-6 relatórios por dia)
- Menos spam
- Foco nos horários importantes
- Economia de créditos da API de IA

**Sugestão**:
```json
{
  "reportHours": {
    "08:00": true,
    "12:00": true,
    "18:00": true,
    "23:00": true
  }
}
```

---

### Para Empresas Grandes/Muito Ativas:
✅ **Usar modo hourly** (24 relatórios por dia)
- Monitoramento constante
- Detecção rápida de problemas
- Atualização frequente de métricas

**Sugestão**:
```json
{
  "reportHours": {
    "hourly": true
  }
}
```

---

## 📊 Comparação de Custos

### API OpenRouter (Geração de Relatórios com IA)

| Modo | Relatórios/Dia | Custo Estimado/Dia* |
|------|----------------|---------------------|
| Horários específicos (4x) | 4 | ~$0.12 |
| Hourly (24x) | 24 | ~$0.72 |

*Baseado em ~$0.03 por relatório (estimativa)

### Por Mês:

| Modo | Relatórios/Mês | Custo Estimado/Mês* |
|------|----------------|---------------------|
| Horários específicos | 120 | ~$3.60 |
| Hourly | 720 | ~$21.60 |

**Nota**: Custos aproximados, variam conforme modelo de IA usado.

---

## 🔒 Segurança e Performance

### Proteção Contra Duplicatas ✅

O sistema garante que **apenas 1 relatório** seja enviado por hora usando:

```python
title = f"Relatório LomusTrack {now_utc.date().isoformat()} {current_hour_utc}"
# Exemplo: "Relatório LomusTrack 2024-01-15 14:00"

# Verifica se já existe
if db.query(NotificationDelivery.id).filter(
    NotificationDelivery.company_id == settings.company_id,
    NotificationDelivery.title == title,
).first():
    continue  # Já enviou, pula
```

### Cache de Dispositivos ✅

Apenas dispositivos ativos (`is_active = true`) recebem notificações.

---

## 🧪 Exemplo de SQL para Teste

```sql
-- 1. Habilitar modo hourly para teste
UPDATE company_settings 
SET notification_preferences = '{"reportHours": {"hourly": true}, "template": "summary"}'::jsonb
WHERE company_id = 1;

-- 2. Aguardar próxima hora cheia

-- 3. Verificar se relatório foi enviado
SELECT 
    title,
    body,
    status,
    sent_count,
    failed_count,
    created_at
FROM notification_delivery
WHERE company_id = 1
  AND data->>'kind' = 'scheduled_report'
  AND created_at > NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC;

-- 4. Ver histórico de 24h
SELECT 
    DATE_TRUNC('hour', created_at) as hora,
    COUNT(*) as total_relatorios,
    SUM(sent_count) as total_enviados,
    SUM(failed_count) as total_falhados
FROM notification_delivery
WHERE company_id = 1
  AND data->>'kind' = 'scheduled_report'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hora DESC;
```

---

## ✅ Checklist de Implementação

- [x] Backend atualizado com modo `"hourly": true`
- [x] Lógica de verificação implementada
- [x] Proteção contra duplicatas mantida
- [x] Compatibilidade com modo tradicional
- [ ] Configurar no banco de dados
- [ ] Testar primeira execução
- [ ] Monitorar por 24h
- [ ] Ajustar conforme necessário

---

## 📚 Documentação Relacionada

- [GUIA_COMPLETO_AUTOMACAO.md](GUIA_COMPLETO_AUTOMACAO.md) - Lógica de automação
- [COMO_CONFIGURAR_CRON_JOB_ORG.md](COMO_CONFIGURAR_CRON_JOB_ORG.md) - Setup do cron
- [COMANDOS_PARA_EXECUTAR.md](COMANDOS_PARA_EXECUTAR.md) - Comandos prontos

---

## 🆘 Troubleshooting

### Relatórios não estão sendo enviados a cada hora

**Verificar**:

1. **Configuração**:
```sql
SELECT notification_preferences->'reportHours' 
FROM company_settings 
WHERE company_id = 1;
```
Deve retornar: `{"hourly": true}`

2. **Push subscriptions ativas**:
```sql
SELECT COUNT(*) 
FROM push_subscriptions 
WHERE company_id = 1 AND is_active = true;
```
Deve ser > 0

3. **OpenRouter configurado**:
```bash
echo $OPENROUTER_API_KEY
```
Não deve estar vazio

4. **Cron job rodando**:
Verificar execution history no cron-job.org

---

### Recebendo relatórios duplicados

**Causa**: Título não está sendo gerado corretamente

**Verificar**:
```sql
SELECT title, COUNT(*) 
FROM notification_delivery 
WHERE company_id = 1 
  AND data->>'kind' = 'scheduled_report'
  AND created_at > NOW() - INTERVAL '1 day'
GROUP BY title
HAVING COUNT(*) > 1;
```

Se retornar resultados, há duplicatas (não deveria acontecer).

---

## 🎯 Resumo

✅ **Modo hourly ativado**: `{"reportHours": {"hourly": true}}`  
✅ **Frequência**: 24 relatórios por dia (1 por hora)  
✅ **Proteção**: Evita duplicatas automaticamente  
✅ **Compatível**: Funciona com modo tradicional  

**Para ativar**: Execute o SQL na seção "Opção 1" acima.

**Para testar**: Aguarde próxima hora cheia e verifique `notification_delivery`.
