import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { RiBankCardLine, RiMoneyDollarCircleLine, RiTeamLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStoredUser } from "@/services/auth";
import { apiRequest } from "@/services/api";
import { fetchUsers, type User } from "@/services/users";

type Financials = {
  currency: string;
  active_subscribers: number;
  paid_subscribers: number;
  monthly_recurring_revenue_estimate: number;
  monthly_operating_costs: number;
  estimated_monthly_profit: number;
  revenue_is_estimate: boolean;
};

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
    </Card>
  );
}

export function CompanyDashboard() {
  const user = typeof window !== "undefined" ? getStoredUser() : null;
  const isSuperAdmin = user?.role === "superadmin";
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [monthlyCosts, setMonthlyCosts] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        const result = await apiRequest<Financials>("/superadmin/financials");
        setFinancials(result);
        setMonthlyCosts(String(result.monthly_operating_costs));
      } else {
        setUsers(await fetchUsers());
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar os dados do painel.");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => { void refresh(); }, [refresh]);

  const saveCosts = async () => {
    const amount = Number(monthlyCosts);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Informe um custo mensal válido, igual ou maior que zero.");
      return;
    }
    setSaving(true);
    try {
      const result = await apiRequest<Financials>("/superadmin/financials/costs", {
        method: "PUT",
        body: { monthly_costs: amount },
      });
      setFinancials(result);
      setMonthlyCosts(String(result.monthly_operating_costs));
      toast.success("Custos mensais salvos.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar os custos.");
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">Resumo da equipe</h2>
          <p className="text-sm text-muted-foreground">Acompanhe os usuários da sua empresa.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Metric title="Usuários cadastrados" value={loading ? "…" : String(users.length)} icon={RiTeamLine} />
          <Metric title="Usuários ativos" value={loading ? "…" : String(users.filter((item) => item.status === "active").length)} icon={RiTeamLine} />
          <Metric title="Aguardando ativação" value={loading ? "…" : String(users.filter((item) => item.status !== "active").length)} icon={RiBankCardLine} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Finanças da LomusTrack</h2>
          <p className="text-sm text-muted-foreground">Visão mensal da receita recorrente e do lucro estimado da empresa.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>Atualizar</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Assinantes ativos" value={loading ? "…" : String(financials?.active_subscribers ?? 0)} icon={RiTeamLine} />
        <Metric title="Assinantes em planos pagos" value={loading ? "…" : String(financials?.paid_subscribers ?? 0)} icon={RiBankCardLine} />
        <Metric title="Receita recorrente mensal estimada" value={loading ? "…" : money(financials?.monthly_recurring_revenue_estimate ?? 0, financials?.currency)} icon={RiMoneyDollarCircleLine} />
        <Metric title="Lucro mensal estimado" value={loading ? "…" : money(financials?.estimated_monthly_profit ?? 0, financials?.currency)} icon={RiMoneyDollarCircleLine} />
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Custos operacionais mensais</CardTitle>
          <CardDescription>Informe os custos da LomusTrack para calcular o lucro estimado junto à receita dos planos ativos.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="lomus-monthly-costs">Custos mensais (USD)</Label>
            <Input id="lomus-monthly-costs" type="number" min="0" step="0.01" value={monthlyCosts} onChange={(event) => setMonthlyCosts(event.target.value)} disabled={loading || saving} />
          </div>
          <Button onClick={() => void saveCosts()} disabled={loading || saving}>{saving ? "Salvando…" : "Salvar custos"}</Button>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        A receita é uma estimativa baseada nos planos pagos ativos; não confirma cobranças recebidas. O lucro exibido subtrai os custos mensais informados acima.
      </p>
    </div>
  );
}
