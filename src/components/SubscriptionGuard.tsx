import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { SubscriptionBlockedScreen } from "./SubscriptionBlockedScreen";
import { useLocation } from "@tanstack/react-router";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

/**
 * Guard que bloqueia o acesso ao app quando o usuário no plano Free
 * atinge o limite de vendas.
 */
export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { isBlocked, blockedReason, subscription, isLoading } = useSubscriptionLimits();
  const location = useLocation();

  // Enquanto carrega, mostra o conteúdo (evita flicker)
  if (isLoading || !subscription) {
    return <>{children}</>;
  }

  // Permitir acesso à página de assinatura mesmo bloqueado
  const allowedPaths = ["/my-subscription", "/login", "/setup", "/admin-login"];
  const isAllowedPath = allowedPaths.some(path => location.pathname.startsWith(path));

  // Se bloqueado e não está em página permitida, mostra tela de bloqueio
  if (isBlocked && blockedReason && !isAllowedPath) {
    return (
      <SubscriptionBlockedScreen
        reason={blockedReason}
        currentSales={subscription.usage.approved_sales_this_month}
        limit={subscription.plan.sales_limit!}
      />
    );
  }

  // Caso contrário, renderiza normalmente
  return <>{children}</>;
}
