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
  const totalLabel = total > 0 ? convertAndFormatMZN(total, 0) : "0";
  const totalLabelClass = totalLabel.length > 10 ? "text-[14px]" : "text-[21px]";

  return (
    <Card className="h-full min-h-[325px] rounded-lg bg-white dark:bg-[#283046] border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
      <CardHeader className="p-4 sm:p-5 pb-0">
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
      <CardContent className="flex min-h-0 flex-1 flex-col justify-between p-4 sm:p-5 pt-2">
        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          {total > 0 && (
            <ChartContainer
              config={chartConfig}
              className="absolute inset-0 mx-auto h-full w-full max-w-[250px]"
            >
              <PieChart>
                <Pie
                  data={values}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={72}
                  outerRadius={104}
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
          <div className="relative z-10 flex w-[120px] flex-col items-center text-center">
            <p className="text-base font-medium text-slate-500 dark:text-slate-400">Total</p>
            <p
              className={`mt-1 whitespace-nowrap font-bold text-slate-900 dark:text-white tabular-nums ${totalLabelClass}`}
            >
              {totalLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted-foreground pt-2">
          {values.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
