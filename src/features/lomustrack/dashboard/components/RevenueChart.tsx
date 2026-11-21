import { convertFromBRL, withSymbol } from "@/lib/currencySettings";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { RiMoneyDollarBoxLine, RiBarChartLine, RiLineChartLine, RiInformationLine } from "@remixicon/react";
import type { DailyRevenue } from "@/types/dashboard";

const chartConfig = {
  revenue: { label: "Faturamento", color: "#0b63e5" },
  spend: { label: "Investido", color: "#f59e0b" },
  profit: { label: "Lucro", color: "#10b981" },
} satisfies ChartConfig;

const metricIcons = {
  revenue: RiMoneyDollarBoxLine,
  spend: RiBarChartLine,
  profit: RiLineChartLine,
};

const metricColors = {
  revenue: "#0b63e5",
  spend: "#f59e0b",
  profit: "#10b981",
};

import { convertAndFormatMZN } from "@/utils/format";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const dateStr = new Date(label).toLocaleDateString("pt-BR", {
    month: "long",
    day: "numeric",
  });

  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-md p-3 shadow-xl min-w-[200px]">
      <p className="text-xs font-medium text-muted-foreground mb-2.5 capitalize">{dateStr}</p>
      <div className="space-y-2">
        {payload.map((entry: any) => {
          const key = entry.dataKey as keyof typeof metricIcons;
          const Icon = metricIcons[key];
          const color = metricColors[key];
          return (
            <div key={key} className="flex items-center gap-2.5">
              <div
                className="flex size-7 items-center justify-center rounded-full"
                style={{ backgroundColor: `color-mix(in oklch, ${color}, transparent 85%)` }}
              >
                <Icon className="size-3.5" style={{ color }} />
              </div>
              <div className="flex flex-1 items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">{chartConfig[key]?.label}</span>
                <span className="text-sm font-semibold tabular-nums">
                  {convertAndFormatMZN(Number(entry.value), 0).replace(/\s*MT\b/gi, "")}
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
  if (data.length === 0) {
    return (
      <Card className="rounded-lg bg-white dark:bg-[#283046] border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
        <CardContent className="flex items-center justify-center h-[340px] text-muted-foreground">
          Sem dados no período
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg bg-white dark:bg-[#283046] border border-slate-200/80 dark:border-white/[0.08] shadow-sm py-0 gap-0">
      <CardHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
              Performance Diária
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Faturamento, investimento e lucro no período
            </CardDescription>
          </div>
          <span
            className="cursor-help text-slate-400/80 hover:text-slate-600 dark:text-slate-400/80 dark:hover:text-slate-200 transition-colors"
            title="Evolução diária de faturamento, investimento e lucro"
          >
            <RiInformationLine className="size-4 shrink-0" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 pt-3 sm:pt-4">
        {data && data.length > 0 ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-[240px] sm:h-[270px] lg:h-[290px] w-full">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0b63e5" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0b63e5" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("pt-BR", { month: "short", day: "numeric" })
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => withSymbol(`${(convertFromBRL(value) / 1000).toFixed(0)}k`).replace(/\s*MT\b/gi, "")}
              />
              <ChartTooltip content={<CustomTooltip />} cursor={false} />
              <Area
                dataKey="revenue"
                type="monotone"
                fill="url(#fillRevenue)"
                stroke="#0b63e5"
                strokeWidth={2}
              />
              <Area
                dataKey="profit"
                type="monotone"
                fill="url(#fillProfit)"
                stroke="#10b981"
                strokeWidth={2}
              />
              <Area
                dataKey="spend"
                type="monotone"
                fill="url(#fillSpend)"
                stroke="#f59e0b"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[240px] items-center justify-center text-xs text-muted-foreground">
            Sem dados de performance no período
          </div>
        )}
      </CardContent>
    </Card>
  );
}
