import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  fetchManagedSubscriptions,
  reviewPlanRequest,
  type ManagedCompanySubscription,
} from "@/services/adminSubscriptions";
import { RiCheckLine, RiMoneyDollarCircleLine, RiRefreshLine, RiSearchLine, RiUserLine } from "@remixicon/react";
import { LOMUS_PLANS } from "./data";
import { getStoredUser } from "@/services/auth";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function AdminBillingPage() {
  const [companies, setCompanies] = useState<ManagedCompanySubscription[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);
  const isSuperAdmin = typeof window !== "undefined" && getStoredUser()?.role === "superadmin";

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchManagedSubscriptions();
      setCompanies(result.companies);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar as assinaturas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) void refresh();
  }, [isSuperAdmin, refresh]);

  const pending = companies.filter((company) => company.pending_request);
  const activeCompanies = companies.filter(
    (company) => company.is_active && (!company.expires_at || new Date(company.expires_at).getTime() > Date.now()),
  );
  const metrics = useMemo(() => ({
    companies: companies.length,
    paid: activeCompanies.filter((company) => company.plan_id !== "free").length,
    monthlyForecast: activeCompanies.reduce((sum, company) => sum + company.monthly_price, 0),
  }), [activeCompanies, companies.length]);

  const filtered = companies.filter((company) =>
    `${company.owner_name} ${company.owner_email} ${company.plan_name} ${company.company_id}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const handleReview = async (requestId: number, decision: "approved" | "rejected") => {
    setBusyRequestId(requestId);
    try {
      await reviewPlanRequest(requestId, decision);
      toast.success(decision === "approved" ? "Pagamento confirmado e plano ativado." : "Solicitação recusada.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a solicitação.");
    } finally {
      setBusyRequestId(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <Card><CardContent className="p-6 text-sm text-muted-foreground">
          Esta área é exclusiva da administração da Lomus. Consulte o seu plano em “Minha assinatura”.
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar assinantes</h1>
          <p className="text-sm text-muted-foreground">Consulte os planos das empresas e analise solicitações de upgrade.</p>
        </div>
        <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
          <RiRefreshLine className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Assinantes" value={String(metrics.companies)} icon={RiUserLine} />
        <Metric title="Assinantes pagos ativos" value={String(metrics.paid)} icon={RiCheckLine} />
        <Metric title="Receita recorrente prevista" value={money(metrics.monthlyForecast)} icon={RiMoneyDollarCircleLine} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações de upgrade ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>
          ) : pending.map((company) => (
            <div key={company.pending_request!.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div>
                <p className="font-medium">{company.owner_name} <span className="text-muted-foreground">· {company.owner_email}</span></p>
                <p className="text-sm text-muted-foreground">
                  Empresa {company.company_id}: {company.plan_name} → {LOMUS_PLANS.find((plan) => plan.id === company.pending_request?.plan_id)?.name}
                  {" · "}{new Date(company.pending_request!.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" disabled={busyRequestId === company.pending_request!.id} onClick={() => void handleReview(company.pending_request!.id, "rejected")}>
                  Recusar
                </Button>
                <Button disabled={busyRequestId === company.pending_request!.id} onClick={() => void handleReview(company.pending_request!.id, "approved")}>
                  {busyRequestId === company.pending_request!.id ? "Salvando..." : "Confirmar pagamento e ativar"}
                </Button>
              </div>
            </div>
          ))}
          {pending.length > 0 && <p className="text-xs text-muted-foreground">Confirme somente depois de verificar o pagamento fora do app. A ativação vale por 30 dias.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Planos disponíveis</CardTitle></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {LOMUS_PLANS.map((plan) => (
            <div key={plan.id} className="rounded-lg border p-4">
              <h3 className="font-semibold">{plan.name}</h3>
              <p className="mt-1 text-2xl font-bold">{money(plan.monthlyPrice)}<span className="ml-1 text-sm font-normal text-muted-foreground">/mês</span></p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-4 space-y-1 text-sm">
                {plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Assinantes e planos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar empresa, responsável ou plano" className="pl-9" />
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground"><tr>
                <th className="px-4 py-3">Empresa</th><th className="px-4 py-3">Plano</th><th className="px-4 py-3">Valor mensal</th><th className="px-4 py-3">Início</th><th className="px-4 py-3">Expiração</th><th className="px-4 py-3">Estado</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {filtered.map((company) => <tr key={company.company_id}>
                  <td className="px-4 py-3"><div className="font-medium">{company.owner_name}</div><div className="text-xs text-muted-foreground">{company.owner_email} · #{company.company_id}</div></td>
                  <td className="px-4 py-3"><Badge variant="outline">{company.plan_name}</Badge></td>
                  <td className="px-4 py-3">{money(company.monthly_price)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{company.started_at ? new Date(company.started_at).toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{company.expires_at ? new Date(company.expires_at).toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="px-4 py-3"><Badge variant={company.is_active ? "default" : "secondary"}>{company.is_active ? "Ativa" : "Suspensa"}</Badge></td>
                </tr>)}
                {!loading && filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhuma empresa encontrada.</td></tr>}
                {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Carregando empresas...</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">A previsão mensal soma o valor dos planos ativos; não representa pagamentos recebidos. Lucro líquido e faturas exigem integração com um provedor de cobrança e registro dos custos.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><Icon className="size-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{value}</p></CardContent></Card>;
}
