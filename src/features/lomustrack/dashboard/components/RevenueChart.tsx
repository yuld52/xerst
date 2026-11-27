import { useState } from "react";
import { convertFromBRL, withSymbol } from "@/lib/currencySettings";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { RiMoneyDollarBoxLine, RiBarChartLine, RiLineChartLine, RiInformationLine } from "@remixicon/react";
import type { DailyRevenue } from "@/types/dashboard";
import { convertAndFormatMZN } from "@/utils/format";

type MetricKey = "revenue" | "spend" | "profit";

const METRICS: ReadonlyArray<{
  key: MetricKey;
  label: string;
  color: string;
  gradientId: string;
  topOpacity: number;
  icon: typeof RiMoneyDollarBoxLine;
}> = [
  {
    key: "revenue",
    label: "Faturamento",
    color: "#0b63e5",
    gradientId: "fillRevenue",
    topOpacity: 0.45,
    icon: RiMoneyDollarBoxLine,
  },
  {
    key: "profit",
    label: "Lucro",
    color: "#10b981",
    gradientId: "fillProfit",
    topOpacity: 0.4,
    icon: RiLineChartLine,
  },
  {
    key: "spend",
    label: "Investido",
    color: "#f59e0b",
    gradientId: "fillSpend",
    topOpacity: 0.35,
    icon: RiBarChartLine,
  },
];

const chartConfig = {
  revenue: { label: "Faturamento", color: "#0b63e5" },
  spend: { label: "Investido", color: "#f59e0b" },
  profit: { label: "Lucro", color: "#10b981" },
} satisfies ChartConfig;

const metricMeta = Object.fromEntries(METRICS.map((m) => [m.key, m])) as Record<
  MetricKey,
  (typeof METRICS)[number]
>;

function formatYAxisValue(value: number): string {
  const converted = convertFromBRL(value);
  if (Math.abs(converted) >= 1000) {
    const k = converted / 1000;
    const formatted = k.toLocaleString("pt-BR", {
      maximumFractionDigits: Math.abs(k) >= 10 ? 0 : 1,
    });
    return withSymbol(`${formatted}k`);
  }
  return withSymbol(converted.toLocaleString("pt-BR", { maximumFractionDigits: 0 }));
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const dateStr = new Date(label).toLocaleDateString("pt-BR", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-md p-3 shadow-xl min-w-[205px]">
      <p className="text-xs font-medium text-muted-foreground mb-2.5 capitalize">{dateStr}</p>
      <div className="space-y-2">
        {payload.map((entry: any) => {
          const key = entry.dataKey as MetricKey;
          const meta = metricMeta[key];
          if (!meta) return null;
          const Icon = meta.icon;
          return (
            <div key={key} className="flex items-center gap-2.5">
              <div
                className="flex size-7 items-center justify-center rounded-full"
                style={{ backgroundColor: `color-mix(in oklch, ${meta.color}, transparent 85%)` }}
              >
                <Icon className="size-3.5" style={{ color: meta.color }} />
              </div>
              <div className="flex flex-1 items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">{meta.label}</span>
                <span className="text-sm font-semibold tabular-nums">
                  {convertAndFormatMZN(Number(entry.value), 0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RevenueChartProps {
  data: DailyRevenue[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [chartMode, setChartMode] = useState<"auto" | "area" | "bar">("auto");
  const [visibleSeries, setVisibleSeries] = useState<Record<MetricKey, boolean>>({
    revenue: true,
    profit: true,
    spend: true,
  });

  if (data.length === 0) {
    return (
      <Card className="rounded-lg bg-white dark:bg-card border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
        <CardContent className="flex items-center justify-center h-[340px] text-muted-foreground">
          Sem dados no período
        </CardContent>
      </Card>
    );
  }

  const effectiveMode = chartMode === "auto" ? (data.length <= 1 ? "bar" : "area") : chartMode;
  const activeMetrics = METRICS.filter((m) => visibleSeries[m.key]);
  const hasNonZeroData = data.some((d) =>
    activeMetrics.some((m) => Number(d[m.key] ?? 0) !== 0),
  );

  const toggleSeries = (key: MetricKey) => {
    setVisibleSeries((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Keep at least one series visible
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  };

  const sharedDefs = (
    <defs>
      {METRICS.map((m) => (
        <linearGradient key={m.gradientId} id={m.gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={m.color} stopOpacity={m.topOpacity} />
          <stop offset="95%" stopColor={m.color} stopOpacity={0.02} />
        </linearGradient>
      ))}
    </defs>
  );

  const sharedAxes = (
    <>
      <CartesianGrid
        vertical={false}
        strokeDasharray="3 3"
        stroke="currentColor"
        strokeOpacity={0.08}
      />
      <XAxis
        dataKey="date"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        minTickGap={32}
        fontSize={11}
        tick={{ fill: "currentColor", opacity: 0.55 }}
        tickFormatter={(value) =>
          new Date(value).toLocaleDateString("pt-BR", { month: "short", day: "numeric" })
        }
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        width={56}
        fontSize={11}
        tick={{ fill: "currentColor", opacity: 0.55 }}
        domain={hasNonZeroData ? ["auto", "auto"] : [0, 100]}
        ticks={hasNonZeroData ? undefined : [0]}
        tickFormatter={formatYAxisValue}
      />
    </>
  );

  return (
    <Card className="rounded-lg bg-white dark:bg-card border border-slate-200/80 dark:border-white/[0.08] shadow-sm py-0 gap-0">
      <CardHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
              Performance Diária
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Faturamento, investimento e lucro no período
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              {METRICS.map((m) => {
                const active = visibleSeries[m.key];
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => toggleSeries(m.key)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all border ${
                      active
                        ? "border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200"
                        : "border-transparent bg-transparent text-slate-400 dark:text-slate-500 opacity-55 hover:opacity-85"
                    }`}
                  >
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: m.color }}
                    />
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div className="inline-flex items-center rounded-md border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.03] p-0.5">
              <button
                type="button"
                onClick={() => setChartMode("area")}
                title="Gráfico de Área"
                className={`rounded p-1 transition-colors ${
                  effectiveMode === "area"
                    ? "bg-white dark:bg-white/10 text-slate-800 dark:text-slate-100 shadow-xs"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <RiLineChartLine className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartMode("bar")}
                title="Gráfico de Barras"
                className={`rounded p-1 transition-colors ${
                  effectiveMode === "bar"
                    ? "bg-white dark:bg-white/10 text-slate-800 dark:text-slate-100 shadow-xs"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <RiBarChartLine className="size-3.5" />
              </button>
            </div>

            <span
              className="cursor-help text-slate-400/80 hover:text-slate-600 dark:text-slate-400/80 dark:hover:text-slate-200 transition-colors"
              title="Evolução diária de faturamento, investimento e lucro. Clique nas legendas para filtrar."
            >
              <RiInformationLine className="size-4 shrink-0" />
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative p-2 sm:p-4 pt-3 sm:pt-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[240px] sm:h-[270px] lg:h-[290px] w-full"
        >
          {effectiveMode === "bar" ? (
            <BarChart
              data={data}
              margin={{ top: 10, right: 8, left: -8, bottom: 0 }}
              barGap={6}
            >
              {sharedDefs}
              {sharedAxes}
              <ChartTooltip
                content={<CustomTooltip />}
                cursor={{ fill: "currentColor", fillOpacity: 0.05 }}
              />
              {activeMetrics.map((m) => (
                <Bar
                  key={m.key}
                  dataKey={m.key}
                  fill={`url(#${m.gradientId})`}
                  stroke={m.color}
                  strokeWidth={1.5}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              ))}
            </BarChart>
          ) : (
            <AreaChart
              data={data}
              margin={{ top: 10, right: 8, left: -8, bottom: 0 }}
            >
              {sharedDefs}
              {sharedAxes}
              <ChartTooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "currentColor", strokeOpacity: 0.18, strokeDasharray: "4 4" }}
              />
              {activeMetrics.map((m) => (
                <Area
                  key={m.key}
                  dataKey={m.key}
                  type="monotone"
                  fill={`url(#${m.gradientId})`}
                  stroke={m.color}
                  strokeWidth={2.25}
                  dot={
                    data.length <= 7
                      ? { r: 3, strokeWidth: 1.5, fill: "var(--card)", stroke: m.color }
                      : false
                  }
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)", fill: m.color }}
                />
              ))}
            </AreaChart>
          )}
        </ChartContainer>

        {!hasNonZeroData && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-6">
            <span className="rounded-full border border-slate-200/70 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              Sem movimentação financeira no período
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
