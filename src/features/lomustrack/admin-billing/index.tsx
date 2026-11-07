import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RiCheckLine,
  RiMoneyDollarCircleLine,
  RiPauseCircleLine,
  RiSearchLine,
  RiUserLine,
} from "@remixicon/react";
import {
  loadSubscriptions,
  LOMUS_PLANS,
  SUBSCRIPTIONS_KEY,
  type Subscription,
  type SubscriptionStatus,
} from "./data";

const statusLabels: Record<SubscriptionStatus, string> = {
  active: "Ativa",
  trial: "Período de teste",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function AdminBillingPage() {
  const [subscriptions, setSubscriptions] = useState(loadSubscriptions);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SubscriptionStatus | "all">("all");

  const persist = (next: Subscription[]) => {
    setSubscriptions(next);
    localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(next));
  };

  const filtered = subscriptions.filter((item) => {
    const planName = LOMUS_PLANS.find((plan) => plan.id === item.plan)?.name ?? item.plan;
    const matchesSearch = `${item.user} ${item.email} ${planName}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesSearch && (status === "all" || item.status === status);
  });

  const metrics = useMemo(() => {
    const active = subscriptions.filter((item) => item.status === "active");
    const revenue = active.reduce((sum, item) => sum + item.amount, 0);
    const costsKnown = active.length > 0 && active.every((item) => item.cost !== null);
    const costs = costsKnown ? active.reduce((sum, item) => sum + (item.cost ?? 0), 0) : null;
    return {
      active: active.length,
      revenue,
      costs,
      profit: costs === null ? null : revenue - costs,
    };
  }, [subscriptions]);

  const toggleStatus = (id: string) => {
    persist(
      subscriptions.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "canceled" ? "active" : "canceled" }
          : item,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assinaturas da Lomus</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie clientes pagantes, receita e lucro da plataforma.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Assinaturas ativas" value={String(metrics.active)} icon={RiUserLine} />
        <Metric
          title="Receita mensal"
          value={money(metrics.revenue)}
          icon={RiMoneyDollarCircleLine}
        />
        <Metric
          title="Custos operacionais"
          value={metrics.costs === null ? "Não configurados" : money(metrics.costs)}
          icon={RiPauseCircleLine}
        />
        <Metric
          title="Lucro mensal"
          value={metrics.profit === null ? "—" : money(metrics.profit)}
          icon={RiCheckLine}
          positive
        />
      </div>

      <section className="space-y-4" aria-labelledby="lomus-plans-title">
        <div>
          <h2 id="lomus-plans-title" className="text-lg font-semibold">
            Planos disponíveis
          </h2>
          <p className="text-sm text-muted-foreground">
            Limites e preços mensais da assinatura Lomus.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {LOMUS_PLANS.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="min-h-10 text-sm text-muted-foreground">{plan.description}</p>
                <p className="text-2xl font-bold">
                  {money(plan.monthlyPrice)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">/mês</span>
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <RiCheckLine className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          * Nos planos pagos, cada venda aprovada acima do limite custa US$ 0,02. O plano Gratuito
          não tem cobranças adicionais.
        </p>
        <p className="text-xs text-muted-foreground">
          O checkout recorrente ainda precisa ser conectado ao provedor de cobrança para ativar
          pagamentos e excedentes automaticamente.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Clientes e planos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <RiSearchLine className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente, e-mail ou plano"
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as SubscriptionStatus | "all")}
            >
              <SelectTrigger className="sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="trial">Em teste</SelectItem>
                <SelectItem value="past_due">Pagamento pendente</SelectItem>
                <SelectItem value="canceled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Renovação</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.user}</div>
                      <div className="text-xs text-muted-foreground">{item.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {LOMUS_PLANS.find((plan) => plan.id === item.plan)?.name ?? item.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{money(item.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(item.renewal).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={item.status === "active" ? "default" : "secondary"}>
                        {statusLabels[item.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => toggleStatus(item.id)}>
                        {item.status === "canceled" ? "Reativar" : "Cancelar"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Os valores desta tela são demonstrativos até a conexão com o provedor de cobrança da
            Lomus.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  title,
  value,
  icon: Icon,
  positive,
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
