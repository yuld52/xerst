import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RiAwardLine, RiTrophyLine } from "@remixicon/react";
import { apiRequest } from "@/services/api";

interface AwardUser {
  id: number;
  name: string;
  email: string | null;
  revenue: number;
}

const MILESTONES = [10_000, 100_000, 1_000_000, 5_000_000, 10_000_000];
function money(value: number) {
  return `MT ${value.toLocaleString("pt-MZ", { maximumFractionDigits: 0 })}`;
}

function milestoneLabel(value: number) {
  return value >= 1_000_000 ? `${value / 1_000_000}M` : `${value / 1_000}K`;
}

export default function AdminAwardsPage() {
  const [users, setUsers] = useState<AwardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    apiRequest<{ users: AwardUser[] }>("/superadmin/awards/progress")
      .then((data) => { if (active) setUsers(data.users); })
      .catch((error) => {
        if (active) setRevenueError(error instanceof Error ? error.message : "Não foi possível buscar o faturamento real.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const rows = useMemo(
    () =>
      users.map((user) => {
        const revenue = user.revenue;
        const achieved = MILESTONES.filter((milestone) => revenue >= milestone);
        const next =
          MILESTONES.find((milestone) => revenue < milestone) ?? MILESTONES[MILESTONES.length - 1];
        const previous = achieved.at(-1) ?? 0;
        const progress =
          achieved.length === MILESTONES.length
            ? 100
            : Math.min(100, ((revenue - previous) / (next - previous)) * 100);
        return { user, revenue, achieved, next, progress };
      }),
    [users],
  );

  const achievedCount = rows.reduce((sum, row) => sum + row.achieved.length, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <RiTrophyLine className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prêmios</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe as metas atingidas por cada usuário.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Usuários acompanhados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading || revenueError ? "—" : rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Prêmios atingidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading || revenueError ? "—" : achievedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{MILESTONES.map(milestoneLabel).join(" · ")}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Progresso por usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando usuários...</p>
          ) : (
            rows.map(({ user, revenue, achieved, next, progress }) => (
              <div key={user.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{money(revenue)}</p>
                    <p className="text-xs text-muted-foreground">
                      Próximo:{" "}
                      {achieved.length === MILESTONES.length
                        ? "Todas as metas"
                        : `${milestoneLabel(next)} MT`}
                    </p>
                  </div>
                </div>
                <Progress value={progress} className="mt-3 h-2" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {MILESTONES.map((milestone) => (
                    <Badge
                      key={milestone}
                      variant={revenue >= milestone ? "default" : "outline"}
                      className="gap-1"
                    >
                      {revenue >= milestone && <RiAwardLine className="size-3" />}
                      {milestoneLabel(milestone)} MT
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          )}
          {revenueError ? (
            <p className="text-xs text-destructive">{revenueError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              O progresso é calculado a partir das vendas aprovadas reais da conta.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
