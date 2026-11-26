import { useMemo } from "react";
import { useCachedQuery } from "./useCachedQuery";
import { fetchCompanySubscription, type CompanySubscription } from "@/services/companySubscription";
import { isAuthenticated } from "@/services/auth";

export interface SubscriptionLimits {
  isBlocked: boolean;
  isNearLimit: boolean;
  blockedReason: string | null;
  subscription: CompanySubscription | null;
  isLoading: boolean;
  salesUsagePercent: number;
  webhooksUsagePercent: number;
  accountsUsagePercent: number;
  canCreateWebhook: boolean;
  canAddAccount: boolean;
  overageSales: number;
  overageCost: number;
  hasInconsistentData: boolean;
}

const OVERAGE_COST_PER_SALE = 0.5; // 0,50 MT por venda extra

export function useSubscriptionLimits(): SubscriptionLimits {
  const {
    data: subscription,
    isLoading,
  } = useCachedQuery<CompanySubscription>({
    cachePrefix: "subscription",
    queryFn: fetchCompanySubscription,
    enabled: isAuthenticated(),
  });

  const limits = useMemo(() => {
    if (!subscription) {
      return {
        isBlocked: false,
        isNearLimit: false,
        blockedReason: null,
        subscription: null,
        isLoading,
        salesUsagePercent: 0,
        webhooksUsagePercent: 0,
        accountsUsagePercent: 0,
        canCreateWebhook: true,
        canAddAccount: true,
        overageSales: 0,
        overageCost: 0,
        hasInconsistentData: false,
      };
    }

    const { plan, usage, plan_id } = subscription;
    const isFree = plan_id === "free";

    // Cálculo de uso percentual
    const salesUsagePercent = plan.sales_limit
      ? Math.min(100, (usage.approved_sales_this_month / plan.sales_limit) * 100)
      : 0;

    const webhooksUsagePercent = plan.webhook_limit
      ? Math.min(100, (usage.webhooks / plan.webhook_limit) * 100)
      : 0;

    const accountsUsagePercent = plan.ad_account_limit
      ? Math.min(100, (usage.ad_accounts / plan.ad_account_limit) * 100)
      : 0;

    // Verificar se atingiu limites hard (com proteção contra dados inconsistentes do backend)
    const salesLimitReached = plan.sales_limit !== null && usage.approved_sales_this_month >= plan.sales_limit;
    const webhooksLimitReached = plan.webhook_limit !== null && usage.webhooks >= plan.webhook_limit;
    const accountsLimitReached = plan.ad_account_limit !== null && usage.ad_accounts >= plan.ad_account_limit;
    
    // Detectar dados inconsistentes (uso maior que limite)
    const hasInconsistentData = 
      (plan.sales_limit !== null && usage.approved_sales_this_month > plan.sales_limit) ||
      (plan.webhook_limit !== null && usage.webhooks > plan.webhook_limit) ||
      (plan.ad_account_limit !== null && usage.ad_accounts > plan.ad_account_limit);

    // HARD LIMIT: Todos os planos são bloqueados ao atingir limite de vendas
    const isBlocked = salesLimitReached;
    const blockedReason = isBlocked
      ? hasInconsistentData
        ? `Limite de vendas excedido (${usage.approved_sales_this_month}/${plan.sales_limit}). Entre em contato com o suporte.`
        : `Você atingiu o limite de ${plan.sales_limit?.toLocaleString('pt-BR')} vendas do plano ${plan.name}. Faça upgrade para continuar usando o LomusTrack.`
      : null;

    // Aviso quando próximo do limite (>80%)
    const isNearLimit = !isBlocked && salesUsagePercent >= 80;

    // Calcular overage (para exibição, mesmo bloqueado)
    const overageSales = plan.sales_limit
      ? Math.max(0, usage.approved_sales_this_month - plan.sales_limit)
      : 0;
    const overageCost = overageSales * OVERAGE_COST_PER_SALE;

    // Permissões para criar recursos
    const canCreateWebhook = !isBlocked && !webhooksLimitReached;
    const canAddAccount = !isBlocked && !accountsLimitReached;

    return {
      isBlocked,
      isNearLimit,
      blockedReason,
      subscription,
      isLoading,
      salesUsagePercent,
      webhooksUsagePercent,
      accountsUsagePercent,
      canCreateWebhook,
      canAddAccount,
      overageSales,
      overageCost,
      hasInconsistentData,
    };
  }, [subscription, isLoading]);

  return limits;
}
