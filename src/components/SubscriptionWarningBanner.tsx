import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RiAlertLine, RiArrowRightLine } from "@remixicon/react";
import { useNavigate } from "@tanstack/react-router";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

export function SubscriptionWarningBanner() {
  const navigate = useNavigate();
  const {
    isNearLimit,
    isBlocked,
    subscription,
    salesUsagePercent,
  } = useSubscriptionLimits();

  if (isBlocked || !isNearLimit || !subscription) return null;

  const usage = subscription.usage.approved_sales_this_month;
  const limit = subscription.plan.sales_limit;

  if (!limit) return null;

  const remaining = limit - usage;

  return (
    <Alert variant="warning" className="mx-6 mt-4">
      <RiAlertLine className="size-5" />
      <div className="flex-1">
        <AlertTitle className="mb-2">
          ⚠️ Atenção: Você está próximo do limite do seu plano
        </AlertTitle>
        <AlertDescription className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>
                {usage.toLocaleString("pt-BR")} / {limit.toLocaleString("pt-BR")} vendas este mês
              </span>
              <span className="font-semibold">{salesUsagePercent.toFixed(0)}%</span>
            </div>
            <Progress value={salesUsagePercent} className="h-2" />
          </div>

          <p className="text-sm">
            Faltam apenas <strong>{remaining} vendas</strong> para atingir o limite.{" "}
            <strong className="text-destructive">
              Sua conta será bloqueada automaticamente
            </strong>{" "}
            ao atingir {limit.toLocaleString('pt-BR')} vendas. Faça upgrade agora para evitar interrupções.
          </p>
        </AlertDescription>
      </div>
      <Button
        variant="default"
        size="sm"
        className="ml-4"
        onClick={() => navigate({ to: "/my-subscription" })}
      >
        Fazer Upgrade
        <RiArrowRightLine className="ml-2 size-4" />
      </Button>
    </Alert>
  );
}
