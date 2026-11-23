import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiLockLine, RiArrowRightLine } from "@remixicon/react";
import { useNavigate } from "@tanstack/react-router";

interface SubscriptionBlockedScreenProps {
  reason: string;
  currentSales: number;
  limit: number;
}

export function SubscriptionBlockedScreen({
  reason,
  currentSales,
  limit,
}: SubscriptionBlockedScreenProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl border-destructive/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <RiLockLine className="size-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Conta Bloqueada - Limite Atingido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="mb-2 text-sm text-muted-foreground">Vendas Aprovadas este Mês</p>
            <p className="text-4xl font-bold">
              {currentSales.toLocaleString('pt-BR')} <span className="text-xl text-muted-foreground">/ {limit.toLocaleString('pt-BR')}</span>
            </p>
          </div>

          <div className="space-y-3 text-center">
            <p className="text-muted-foreground">{reason}</p>
            <p className="text-sm text-muted-foreground">
              Sua conta foi temporariamente bloqueada porque você atingiu o limite de vendas do seu plano atual.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="mb-2 font-semibold">🚀 Desbloqueie sua conta agora</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Faça upgrade para um plano maior e continue usando todas as funcionalidades do
                LomusTrack sem interrupções.
              </p>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span><strong>Gratuito:</strong> 80 vendas/mês</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span><strong>Premium:</strong> 1.000 vendas/mês por $29</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span><strong>Monster:</strong> 5.000 vendas/mês por $79</span>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate({ to: "/my-subscription" })}
            >
              Ver Planos e Fazer Upgrade
              <RiArrowRightLine className="ml-2 size-5" />
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Seus dados estão seguros e serão restaurados imediatamente após o upgrade.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
