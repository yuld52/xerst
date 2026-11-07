import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@/lib/import-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiArrowRightLine, RiBankCardLine, RiMoneyDollarCircleLine, RiTeamLine } from "@remixicon/react";
import { getStoredUser } from "@/services/auth";
import { fetchManagedSubscriptions, type ManagedCompanySubscription } from "@/services/adminSubscriptions";
import { fetchCompanySubscription, type CompanySubscription } from "@/services/companySubscription";
import { fetchUsers, type User } from "@/services/users";
import { LOMUS_PLANS } from "@/features/lomustrack/admin-billing/data";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><Icon className="size-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{value}</p></CardContent></Card>;
}

export function CompanyDashboard() {
  const navigate = useNavigate();
  const user = typeof window !== "undefined" ? getStoredUser() : null;
  const isSuperAdmin = user?.role === "superadmin";
  const [companies, setCompanies] = useState<ManagedCompanySubscription[]>([]);
  const [companySubscription, setCompanySubscription] = useState<CompanySubscription | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        const result = await fetchManagedSubscriptions();
        setCompanies(result.companies);
      } else {
        setUsersLoading(true);
        const [subscription, companyUsers] = await Promise.all([fetchCompanySubscription(), fetchUsers()]);
        setCompanySubscription(subscription);
        setUsers(companyUsers);
        setUsersLoading(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar os dados das assinaturas.");
    } finally {
      setUsersLoading(false);
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => { void refresh(); }, [refresh]);

  const activeCompanies = companies.filter((company) => company.is_active && (!company.expires_at || new Date(company.expires_at).getTime() > Date.now()));
  const monthlyForecast = activeCompanies.reduce((sum, company) => sum + company.monthly_price, 0);
  const planCounts = LOMUS_PLANS.map((plan) => ({
    ...plan,
    count: activeCompanies.filter((company) => company.plan_id === plan.id).length,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Dashboard de Assinaturas</h2>
          <p className="text-sm text-muted-foreground">
            {isSuperAdmin ? "Indicadores calculados a partir dos planos reais das empresas." : "Resumo do plano e uso da sua empresa."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>Atualizar</Button>
      </div>

      {isSuperAdmin ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric title="Empresas ativas" value={String(activeCompanies.length)} icon={RiBankCardLine} />
            <Metric title="Planos pagos ativos" value={String(activeCompanies.filter((company) => company.plan_id !== "free").length)} icon={RiTeamLine} />
            <Metric title="Previsão mensal contratada" value={money(monthlyForecast)} icon={RiMoneyDollarCircleLine} />
            <Metric title="Usuários cadastrados" value={String(companies.reduce((sum, company) => sum + company.user_count, 0))} icon={RiTeamLine} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Assinaturas ativas por plano</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {planCounts.map((plan) => <div key={plan.id} className="flex items-center justify-between rounded-lg border p-3"><span className="font-medium">{plan.name}</span><Badge variant="secondary">{plan.count} ativa{plan.count === 1 ? "" : "s"}</Badge></div>)}
                <p className="border-t pt-3 text-xs text-muted-foreground">Previsão mensal não representa pagamentos recebidos. Lucro líquido exige dados reais de cobrança e custos.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2"><RiTeamLine className="size-5 text-brand" /><CardTitle>Empresas</CardTitle></div>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/admin/subscriptions")}>Gerenciar<RiArrowRightLine className="size-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-2">{loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : companies.slice(0, 5).map((company) => <div key={company.company_id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><span className="min-w-0 truncate">{company.owner_name} <span className="text-muted-foreground">· {company.owner_email}</span></span><Badge variant="outline">{company.plan_name}</Badge></div>)}</CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Metric title="Plano atual" value={companySubscription?.plan.name ?? (loading ? "Carregando..." : "—")} icon={RiBankCardLine} />
            <Metric title="Mensalidade" value={money(companySubscription?.plan.monthly_price ?? 0)} icon={RiMoneyDollarCircleLine} />
            <Metric title="Vendas aprovadas neste mês" value={String(companySubscription?.usage.approved_sales_this_month ?? 0)} icon={RiTeamLine} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardHeader><CardTitle>Uso do plano</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Vendas aprovadas</span><span>{companySubscription?.usage.approved_sales_this_month ?? 0} / {companySubscription?.plan.sales_limit ?? "—"}</span></div>
              <div className="flex justify-between"><span>Contas de anúncio</span><span>{companySubscription?.usage.ad_accounts ?? 0} / {companySubscription?.plan.ad_account_limit ?? "Ilimitado"}</span></div>
              <div className="flex justify-between"><span>Webhooks</span><span>{companySubscription?.usage.webhooks ?? 0} / {companySubscription?.plan.webhook_limit ?? "Ilimitado"}</span></div>
              <Button variant="outline" className="w-full" onClick={() => navigate("/my-subscription")}>Ver assinatura</Button>
            </CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between"><div className="flex items-center gap-2"><RiTeamLine className="size-5 text-brand" /><CardTitle>Usuários da empresa</CardTitle></div><Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/admin/users")}>Gerenciar<RiArrowRightLine className="size-4" /></Button></CardHeader><CardContent>{usersLoading ? <p className="text-sm text-muted-foreground">Carregando usuários...</p> : <div className="grid grid-cols-3 gap-3"><Summary label="Total" value={users.length} /><Summary label="Ativos" value={users.filter((item) => item.status === "active").length} /><Summary label="Pendentes" value={users.filter((item) => item.status !== "active").length} /></div>}</CardContent></Card>
          </div>
        </>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>;
}
