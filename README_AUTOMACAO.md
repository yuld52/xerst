# 📚 Documentação de Automação do LomusTrack

Bem-vindo à documentação completa do sistema de automação do LomusTrack!

---

## 🎯 Escolha Seu Guia

### **🚀 [GUIA_COMPLETO_AUTOMACAO.md](./GUIA_COMPLETO_AUTOMACAO.md)**
**📖 Recomendado para iniciantes**

Guia passo a passo completo desde o início:
- ✅ Configuração do backend
- ✅ Criação de cron jobs
- ✅ Configuração de regras de campanhas
- ✅ Configuração de relatórios push
- ✅ Testes e monitoramento
- ✅ Troubleshooting completo
- ✅ FAQ com todas as dúvidas

**👉 Comece por aqui se é sua primeira vez configurando!**

---

### **⏰ [CRON_JOBS_SETUP.md](./CRON_JOBS_SETUP.md)**
**🔧 Referência técnica do cron-job.org**

Foco em configuração técnica dos cron jobs:
- ✅ Como usar o cron-job.org
- ✅ Configuração de segurança (tokens)
- ✅ Endpoints disponíveis
- ✅ Cron expressions
- ✅ Monitoramento e logs
- ✅ Troubleshooting específico de cron

**👉 Use como referência rápida para cron jobs**

---

### **🤖 [COMO_CONFIGURAR_AUTOMACAO.md](./COMO_CONFIGURAR_AUTOMACAO.md)**
**💡 Exemplos práticos e casos de uso**

Foco em regras e relatórios:
- ✅ Exemplos de regras de campanhas
- ✅ Como criar regras efetivas
- ✅ Configuração de relatórios push
- ✅ Casos de uso reais
- ✅ Métricas e condições
- ✅ Melhores práticas

**👉 Use para criar regras personalizadas**

---

## 📊 Resumo do Sistema

### **O Que Você Vai Configurar:**

```
┌─────────────────────────────────────────────────┐
│          SISTEMA DE AUTOMAÇÃO LOMUSTRACK        │
├─────────────────────────────────────────────────┤
│                                                 │
│  🤖 Regras de Campanhas (a cada 10 min)       │
│     • Pausar/Ativar automaticamente            │
│     • Ajustar budgets                          │
│     • 144 verificações/dia                     │
│                                                 │
│  📊 Relatórios Push (horários personalizados) │
│     • 08:00, 12:00, 18:00, 23:00 UTC          │
│     • Escolha quantos quiser                   │
│     • 3 formatos disponíveis                   │
│                                                 │
│  🔄 Automático 24/7                            │
│     • Sem intervenção manual                   │
│     • Economia de tempo                        │
│     • Maximização de lucro                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ⚡ Início Rápido (5 Passos)

### **1. Configure o Backend**
```env
CRON_SECRET=seu_token_secreto_aqui
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

### **2. Crie Cron Job no cron-job.org**
```
URL: https://www.lomustrack.online/api/automation/run
Schedule: */10 * * * * (a cada 10 min)
Header: Authorization: Bearer SEU_TOKEN
```

### **3. Crie Regras no LomusTrack**
```
Campanhas → Regras → + Nova regra
Ex: Pausar se CPA > 150 MT
```

### **4. Configure Relatórios**
```
Configurações → Notificações
Ative horários desejados
```

### **5. Monitore**
```
Aguarde 10 minutos
Verifique histórico no cron-job.org
Receba primeiro relatório no horário configurado
```

---

## 🎓 Ordem Recomendada de Leitura

### **Para Iniciantes:**
1. 📖 [GUIA_COMPLETO_AUTOMACAO.md](./GUIA_COMPLETO_AUTOMACAO.md) - Leia do início ao fim
2. ✅ Configure seguindo o guia passo a passo
3. 🤖 [COMO_CONFIGURAR_AUTOMACAO.md](./COMO_CONFIGURAR_AUTOMACAO.md) - Crie suas regras personalizadas
4. ⏰ [CRON_JOBS_SETUP.md](./CRON_JOBS_SETUP.md) - Consulte quando precisar ajustar cron

### **Para Usuários Avançados:**
1. ⏰ [CRON_JOBS_SETUP.md](./CRON_JOBS_SETUP.md) - Configure cron jobs rapidamente
2. 🤖 [COMO_CONFIGURAR_AUTOMACAO.md](./COMO_CONFIGURAR_AUTOMACAO.md) - Crie regras avançadas
3. 📖 [GUIA_COMPLETO_AUTOMACAO.md](./GUIA_COMPLETO_AUTOMACAO.md) - Consulte seções específicas

---

## 🔗 Links Úteis

- [Console cron-job.org](https://console.cron-job.org/)
- [Cron Expression Generator](https://crontab.guru/)
- [Documentação Meta Ads API](https://developers.facebook.com/docs/marketing-apis/)
- [OpenRouter](https://openrouter.ai/)

---

## 📞 Precisa de Ajuda?

### **1. Consulte a Documentação**
- [Troubleshooting](./GUIA_COMPLETO_AUTOMACAO.md#troubleshooting)
- [FAQ](./GUIA_COMPLETO_AUTOMACAO.md#faq)

### **2. Verifique Configurações**
- Backend com variáveis corretas
- Cron jobs ativos
- Regras ativadas
- Relatórios configurados

### **3. Entre em Contato**
- Suporte do LomusTrack
- GitHub Issues

---

## 📊 Checklist Rápida

```
Backend:
 ☐ CRON_SECRET configurado
 ☐ OPENROUTER_API_KEY configurado (opcional)
 ☐ Backend deployado

Cron Jobs:
 ☐ Conta criada no cron-job.org
 ☐ Cron job "Regras" criado (*/10 * * * *)
 ☐ Cron job "Relatórios" criado (0 */1 * * *) - opcional
 ☐ Headers configurados
 ☐ Teste manual OK

LomusTrack:
 ☐ Conta Facebook Ads conectada
 ☐ Pelo menos 1 regra criada e ativada
 ☐ Pelo menos 1 horário de relatório ativado
 ☐ Pelo menos 1 dispositivo inscrito

Verificação:
 ☐ Primeira execução do cron confirmada
 ☐ Regra executada com sucesso
 ☐ Relatório recebido no horário
```

---

## 🎉 Status: Pronto para Começar!

Escolha um guia acima e comece sua jornada de automação! 🚀

**Dica:** Se está começando agora, abra o [GUIA_COMPLETO_AUTOMACAO.md](./GUIA_COMPLETO_AUTOMACAO.md) e siga passo a passo.

---

**Última atualização:** 22 de novembro de 2024  
**Versão:** 1.0  

✨ **Boa automação!** ✨
