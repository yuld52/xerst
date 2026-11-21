import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { RiShoppingBag3Line, RiMoneyDollarBoxLine, RiInformationLine } from "@remixicon/react";
import type { HourlySale } from "@/types/dashboard";

const chartConfig = {
  sales: { label: "Vendas", color: "var(--chart-3)" },
} satisfies ChartConfig;

import { convertAndFormatMZN } from "@/utils/format";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const sales = payload[0]?.value ?? 0;
  const revenue = payload[0]?.payload?.revenue ?? 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-md p-3 shadow-xl min-w-[180px]">
      <p className="text-xs font-medium text-muted-foreground mb-2.5">{label}</p>
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-7 items-center justify-center rounded-full"
            style={{ backgroundColor: "color-mix(in oklch, var(--chart-3), transparent 85%)" }}
          >
            <RiShoppingBag3Line className="size-3.5" style={{ color: "var(--chart-3)" }} />
          </div>
          <div className="flex flex-1 items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Vendas</span>
            <span className="text-sm font-semibold tabular-nums">{sales}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-7 items-center justify-center rounded-full"
            style={{ backgroundColor: "color-mix(in oklch, var(--chart-1), transparent 85%)" }}
          >
            <RiMoneyDollarBoxLine className="size-3.5" style={{ color: "var(--chart-1)" }} />
          </div>
          <div className="flex flex-1 items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Faturamento</span>
            <span className="text-sm font-semibold tabular-nums">
              {convertAndFormatMZN(Number(revenue), 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface HourlySalesChartProps {
  data: HourlySale[];
}

export function HourlySalesChart({ data }: HourlySalesChartProps) {
  return (
    <Card className="rounded-lg bg-white dark:bg-[#283046] border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col justify-between py-0 gap-0">
      <CardHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
              Vendas por Hora
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Horários de pico de vendas no período
            </CardDescription>
          </div>
          <span
            className="cursor-help text-slate-400/80 hover:text-slate-600 dark:text-slate-400/80 dark:hover:text-slate-200 transition-colors"
            title="Distribuição das vendas por hora do dia"
          >
            <RiInformationLine className="size-4 shrink-0" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 flex-1 flex flex-col justify-end">
        <ChartContainer config={chartConfig} className="aspect-auto h-[180px] sm:h-[200px] lg:h-[220px] w-full mt-auto">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <ChartTooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
