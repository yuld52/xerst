import { RiInformationLine } from "@remixicon/react";
import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { convertAndFormatMZN } from "@/utils/format";

export interface PaymentMethodDist {
  name: string;
  value: number;
}

const PAYMENT_METHODS = [
  { name: "Pix", color: "#0b63e5" },
  { name: "Cartão", color: "#3bb4e8" },
  { name: "Boleto", color: "#f2be32" },
  { name: "Outros", color: "#ee3d61" },
] as const;

const chartConfig = PAYMENT_METHODS.reduce(
  (config, method) => ({
    ...config,
    [method.name]: { label: method.name, color: method.color },
  }),
  { value: { label: "Vendas por pagamento" } } as ChartConfig,
);

interface PaymentMethodChartProps {
  data?: PaymentMethodDist[];
}

export function PaymentMethodChart({ data = [] }: PaymentMethodChartProps) {
  const values = PAYMENT_METHODS.map((method) => ({
    ...method,
    value: data.find((item) => item.name.toLowerCase() === method.name.toLowerCase())?.value ?? 0,
  }));
  const total = values.reduce((sum, item) => sum + item.value, 0);
  const totalLabel = convertAndFormatMZN(total, 0);
  const totalLabelClass = totalLabel.length > 10 ? "text-xs sm:text-sm lg:text-base" : "text-sm sm:text-base lg:text-xl";

  return (
    <Card className="h-full min-h-[320px] lg:min-h-[360px] rounded-lg bg-white dark:bg-card border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col justify-between py-0 gap-0">
      <CardHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-white/[0.04]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
            Vendas por Pagamento
          </CardTitle>
          <span
            className="cursor-help text-slate-400/80 hover:text-slate-600 dark:text-slate-400/80 dark:hover:text-slate-200 transition-colors"
            title="Divisão do faturamento por método de pagamento e total do período."
          >
            <RiInformationLine
              className="size-4"
              aria-label="O card mostra a divisão do faturamento por método de pagamento e o total do período"
            />
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 flex flex-1 flex-col justify-between">
        <div className="relative flex flex-1 items-center justify-center my-auto min-h-[200px] lg:min-h-[250px]">
          {total > 0 && (
            <ChartContainer
              config={chartConfig}
              className="aspect-square h-[200px] w-[200px] sm:h-[230px] sm:w-[230px] lg:h-[250px] lg:w-[250px] mx-auto"
            >
              <PieChart>
                <Pie
                  data={values}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="82%"
                  stroke="transparent"
                  strokeWidth={0}
                >
                  {values.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Total</p>
            <p
              className={`mt-0.5 whitespace-nowrap font-bold text-slate-900 dark:text-white tabular-nums ${totalLabelClass}`}
            >
              {totalLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-2">
          {values.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
