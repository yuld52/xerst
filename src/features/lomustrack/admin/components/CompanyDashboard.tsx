import { useMemo } from "react";
import { useNavigate } from "@/lib/import-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RiArrowRightLine,
  RiBankCardLine,
  RiMoneyDollarCircleLine,
  RiPercentLine,
  RiTeamLine,
} from "@remixicon/react";
import { useUsers } from "@/hooks/useUsers";
import { loadSubscriptions } from "@/features/lomustrack/admin-billing/data";

function money(value: number) {
  return `MT ${value.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}`;
}

function Metric({
  title,
  value,
  icon: Icon,
  positive = false,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  positive?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={positive ? "size-4 text-emerald-500" : "size-4 text-muted-foreground"} />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function CompanyDashboard() {
  const navigate = useNavigate();
  const { users, loading: usersLoading } = useUsers();
  const subscriptions = loadSubscriptions();
  const metrics = useMemo(() => {
    const active = subscriptions.filter((item) => item.status === "active");
    const revenue = active.reduce((sum, item) => sum + item.amount, 0);
    const costs = active.reduce((sum, item) => sum + item.cost, 0);
    const plans = active.reduce<Record<string, number>>((result, item) => {
      result[item.plan] = (result[item.plan] || 0) + 1;
      return result;
    }, {});
    return {
      active,
      revenue,
      costs,
      profit: revenue - costs,
      margin: revenue ? ((revenue - costs) / revenue) * 100 : 0,
      plans,
    };
  }, [subscriptions]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Dashboard de Assinaturas</h2>
        <p className="text-sm text-muted-foreground">
          Receita, custos e lucro gerados pelos planos pagos da Lomus.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Assinaturas ativas"
          value={String(metrics.active.length)}
          icon={RiBankCardLine}
        />
        <Metric
          title="Receita recorrente"
          value={money(metrics.revenue)}
          icon={RiMoneyDollarCircleLine}
        />
        <Metric
          title="Lucro estimado"
          value={money(metrics.profit)}
          icon={RiMoneyDollarCircleLine}
          positive
        />
        <Metric
          title="Margem de lucro"
          value={`${metrics.margin.toFixed(1)}%`}
          icon={RiPercentLine}
          positive
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assinaturas por plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.plans).map(([plan, count]) => (
              <div
                key={plan}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <span className="font-medium">{plan}</span>
                <Badge variant="secondary">
                  {count} ativa{count === 1 ? "" : "s"}
                </Badge>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
              <span>Custos estimados</span>
              <span>{money(metrics.costs)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <RiTeamLine className="size-5 text-brand" />
              <CardTitle>Usuários</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate("/admin/users")}
            >
              Gerenciar
              <RiArrowRightLine className="size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <p className="text-sm text-muted-foreground">Carregando usuários...</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <Summary label="Total" value={users.length} />
                <Summary
                  label="Ativos"
                  value={users.filter((user) => user.status === "active").length}
                />
                <Summary
                  label="Pendentes"
                  value={users.filter((user) => user.status !== "active").length}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
