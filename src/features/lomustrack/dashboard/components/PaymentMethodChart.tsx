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
    <Card className="h-full min-h-[325px] border-0 bg-card shadow-[0_4px_18px_rgba(15,23,42,0.06)]">
      <CardHeader className="relative -top-2 px-5 pb-0 pt-5">
        <div className="flex items-center justify-start gap-2 whitespace-nowrap">
          <CardTitle className="text-left text-lg font-semibold text-foreground">
            Vendas por Pagamento
          </CardTitle>
          <span
            className="absolute right-5 top-1/2 -translate-y-1/2"
            title="Este card mostra como o faturamento total foi dividido entre Pix, Cartão, Boleto e Outros. A roda representa a proporção de cada método e o centro mostra o total do período."
          >
            <RiInformationLine
              className="size-[17px] text-muted-foreground"
              aria-label="O card mostra a divisão do faturamento por método de pagamento e o total do período"
            />
          </span>
        </div>
      </CardHeader>
      <CardContent className="relative -top-2 flex min-h-0 flex-1 flex-col justify-between px-5 pb-4 pt-0">
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
            <p className="text-[21px] leading-7 text-muted-foreground">Total</p>
            <p
              className={`mt-1 whitespace-nowrap leading-6 text-muted-foreground tabular-nums ${totalLabelClass}`}
            >
              {totalLabel}
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-5 right-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {values.map((item) => (
            <div key={item.name} className="flex items-center gap-2 whitespace-nowrap">
              <span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
