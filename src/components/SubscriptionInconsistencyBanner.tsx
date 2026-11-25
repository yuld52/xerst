import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RiAlertLine, RiRefreshLine } from "@remixicon/react";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

export function SubscriptionInconsistencyBanner() {
  const { hasInconsistentData, subscription } = useSubscriptionLimits();

  if (!hasInconsistentData || !subscription) return null;

  const handleRefresh = () => {
    window.location.reload();
  };

  const getInconsistencyDetails = () => {
    const issues = [];
    
    if (subscription.plan.sales_limit !== null && 
        subscription.usage.approved_sales_this_month > subscription.plan.sales_limit) {
      issues.push(
        `Vendas: ${subscription.usage.approved_sales_this_month}/${subscription.plan.sales_limit}`
      );
    }
    
    if (subscription.plan.webhook_limit !== null && 
        subscription.usage.webhooks > subscription.plan.webhook_limit) {
      issues.push(
        `Webhooks: ${subscription.usage.webhooks}/${subscription.plan.webhook_limit}`
      );
    }
    
    if (subscription.plan.ad_account_limit !== null && 
        subscription.usage.ad_accounts > subscription.plan.ad_account_limit) {
      issues.push(
        `Contas: ${subscription.usage.ad_accounts}/${subscription.plan.ad_account_limit}`
      );
    }
    
    return issues.join(" • ");
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <RiAlertLine className="size-4" />
      <AlertTitle className="flex items-center justify-between gap-3">
        <span>Dados de subscrição inconsistentes</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="h-7 gap-1.5 text-xs"
        >
          <RiRefreshLine className="size-3.5" />
          Atualizar
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-1">
        <p>
          Os limites de uso estão com valores incorretos: {getInconsistencyDetails()}
        </p>
        <p className="text-xs opacity-90">
          Este é um problema temporário do servidor. Entre em contato com o suporte se persistir.
        </p>
      </AlertDescription>
    </Alert>
  );
}
