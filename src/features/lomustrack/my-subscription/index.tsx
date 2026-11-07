import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  fetchCompanySubscription,
  requestCompanyPlan,
  type CompanySubscription,
} from "@/services/companySubscription";
import { RiBankCardLine, RiCheckLine, RiRefreshLine, RiTimeLine } from "@remixicon/react";

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function limitLabel(limit: number | null) {
  return limit === null ? "Ilimitado" : limit.toLocaleString("pt-BR");
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const percent = limit === null ? 0 : Math.min(100, limit > 0 ? (used / limit) * 100 : 0);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {used.toLocaleString("pt-BR")} / {limitLabel(limit)}
        </span>
      </div>
      {limit !== null && <Progress value={percent} className="h-2" />}
    </div>
  );
}

export default function MySubscriptionPage() {
  const [subscription, setSubscription] = useState<CompanySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [requestingPlan, setRequestingPlan] = useState<"premium" | "monster" | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSubscription(await fetchCompanySubscription());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível carregar sua assinatura.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const requestUpgrade = async (planId: "premium" | "monster") => {
    setRequestingPlan(planId);
    try {
      await requestCompanyPlan(planId);
      toast.success("Solicitação enviada", {
        description: "A equipe Lomus vai revisar seu pedido. O plano só muda após a confirmação.",
      });
      setUpgradeOpen(false);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a solicitação.");
    } finally {
      setRequestingPlan(null);
    }
  };

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null;
  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Minha assinatura</h1>
          <p className="text-sm text-muted-foreground">Plano e limites atuais da sua empresa.</p>
        </div>
        <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
          <RiRefreshLine className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {loading && !subscription ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Carregando assinatura...
          </CardContent>
        </Card>
      ) : subscription ? (
        <>
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">Plano {subscription.plan.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {currency(subscription.plan.monthly_price)} / mês
                  </p>
                </div>
                <Badge variant="secondary">
                  {expiresAt && daysLeft === 0 ? "Expirado" : "Ativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <RiTimeLine className="size-4" />
                  {expiresAt
                    ? `Expira em ${daysLeft} dia${daysLeft === 1 ? "" : "s"} — ${expiresAt.toLocaleDateString("pt-BR")}`
                    : "Sem data de expiração configurada"}
                </span>
                {subscription.started_at && (
                  <span>Desde {new Date(subscription.started_at).toLocaleDateString("pt-BR")}</span>
                )}
              </div>
              {subscription.expires_at && daysLeft !== null && (
                <Progress
                  value={Math.max(0, Math.min(100, (daysLeft / 30) * 100))}
                  className="h-2"
                />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cobrança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <RiBankCardLine className="size-5 text-muted-foreground" />
                  <span>
                    Plano {subscription.plan.name} — {currency(subscription.plan.monthly_price)}/mês
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => setUpgradeOpen(true)}
                  disabled={Boolean(subscription.pending_plan_request)}
                >
                  {subscription.pending_plan_request ? "Upgrade solicitado" : "Ver planos e solicitar upgrade"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {subscription.pending_plan_request
                    ? `Solicitação do plano ${subscription.available_plans.find((plan) => plan.id === subscription.pending_plan_request?.plan_id)?.name ?? "pago"} em análise.`
                    : "O pedido será analisado pela equipe. A mudança de plano ocorre após a confirmação do pagamento."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento de uso neste mês</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <UsageRow
                  label="Vendas aprovadas"
                  used={subscription.usage.approved_sales_this_month}
                  limit={subscription.plan.sales_limit}
                />
                <UsageRow
                  label="Contas de anúncio"
                  used={subscription.usage.ad_accounts}
                  limit={subscription.plan.ad_account_limit}
                />
                <UsageRow
                  label="Webhooks configurados"
                  used={subscription.usage.webhooks}
                  limit={subscription.plan.webhook_limit}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de faturas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  O histórico ficará disponível quando a cobrança recorrente for conectada.
                </p>
              </CardContent>
            </Card>
          </div>

          <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Planos Lomus</DialogTitle>
                <DialogDescription>
                  Escolha um plano para enviar uma solicitação à equipe Lomus. A ativação depende da
                  confirmação do pagamento.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-3">
                {subscription.available_plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={plan.id === subscription.plan_id ? "border-primary" : undefined}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-2 text-base">
                        {plan.name}
                        {plan.id === subscription.plan_id && (
                          <RiCheckLine className="size-4 text-primary" />
                        )}
                      </CardTitle>
                      <p className="text-xl font-bold">
                        {currency(plan.monthly_price)}
                        <span className="text-sm font-normal text-muted-foreground">/mês</span>
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <p>{limitLabel(plan.sales_limit)} vendas aprovadas/mês</p>
                      <p>{limitLabel(plan.ad_account_limit)} contas de anúncio</p>
                      <p>{limitLabel(plan.webhook_limit)} webhooks</p>
                      <Button
                        className="w-full"
                        variant={plan.id === subscription.plan_id ? "secondary" : "outline"}
                        disabled={
                          plan.id === subscription.plan_id ||
                          plan.id === "free" ||
                          Boolean(subscription.pending_plan_request) ||
                          requestingPlan !== null
                        }
                        onClick={() => {
                          if (plan.id === "premium" || plan.id === "monster") {
                            void requestUpgrade(plan.id);
                          }
                        }}
                      >
                        {plan.id === subscription.plan_id
                          ? "Plano atual"
                          : subscription.pending_plan_request?.plan_id === plan.id
                            ? "Solicitação enviada"
                            : plan.id === "free"
                              ? "Disponível ao criar conta"
                              : requestingPlan === plan.id
                                ? "Enviando..."
                                : subscription.pending_plan_request
                                  ? "Há uma solicitação em análise"
                                  : "Solicitar este plano"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Nos planos pagos, cada venda aprovada que exceder a franquia custa US$ 0,02. O plano
                Gratuito não tem cobrança adicional. A cobrança automática ainda não está configurada.
              </p>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Os dados da assinatura não estão disponíveis agora.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
