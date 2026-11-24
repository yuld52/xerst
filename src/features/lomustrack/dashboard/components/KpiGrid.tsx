import {
  RiMoneyDollarBoxLine,
  RiLineChartLine,
  RiBarChartLine,
  RiFocus3Line,
  RiShoppingBagLine,
  RiPercentLine,
  RiCursorLine,
  RiErrorWarningLine,
} from "@remixicon/react";
import { KpiCard } from "./KpiCard";
import type { DashboardKpis } from "@/types/dashboard";
import { fmtCompact } from "@/utils/format";

interface KpiGridProps {
  kpis: DashboardKpis;
  taxEnabled: boolean;
  taxRate: number;
  opCostsEnabled: boolean;
  opCostsTotal: number;
}

export function KpiGrid({ kpis, taxEnabled, taxRate, opCostsEnabled, opCostsTotal }: KpiGridProps) {
  const taxDeduction = taxEnabled ? kpis.total_revenue * (taxRate / 100) : 0;
  const opDeduction = opCostsEnabled ? opCostsTotal : 0;
  const revenue = kpis.total_revenue - taxDeduction;
  const profit = kpis.profit - taxDeduction - opDeduction;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const roas = kpis.total_spend > 0 ? revenue / kpis.total_spend : 0;

  // Check if there's any data
  const hasData = kpis.total_revenue > 0 || kpis.total_spend > 0 || kpis.total_sales > 0;

  const revenueLabel = [
    "Faturamento Líquido",
    taxEnabled ? "- impostos" : "",
    opCostsEnabled ? "- custos" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const profitLabel = ["Lucro", taxEnabled ? "- impostos" : "", opCostsEnabled ? "- custos" : ""]
    .filter(Boolean)
    .join(" ");

  const kpiCards = [
    {
      title: revenueLabel,
      value: fmtCompact(revenue),
      rawValue: revenue,
      tooltip: "Faturamento Líquido total",
      icon: RiMoneyDollarBoxLine,
      variant: (hasData && revenue > 0 ? "primary" : "default") as const,
    },
    {
      title: "Gastos com anúncios",
      value: fmtCompact(kpis.total_spend),
      rawValue: kpis.total_spend,
      tooltip: "Total investido em anúncios",
      icon: RiBarChartLine,
      subtitle: kpis.cpa > 0 ? `CPA: ${fmtCompact(kpis.cpa)}` : undefined,
      variant: "default" as const,
    },
    {
      title: "ROAS",
      value: kpis.total_spend > 0 ? `${roas.toFixed(2)}x` : "N/A",
      tooltip: "Retorno sobre gastos com anúncios (Receita / Gasto)",
      icon: RiFocus3Line,
      variant: (hasData && roas < 1 ? "destructive" : hasData && roas > 0 ? "primary" : "default") as const,
    },
    {
      title: profitLabel,
      value: fmtCompact(profit),
      rawValue: profit,
      tooltip: "Lucro líquido final",
      icon: RiLineChartLine,
      variant: (hasData ? (profit >= 0 ? "success" : "destructive") : "default") as const,
    },
    {
      title: "Vendas",
      value: kpis.total_sales.toLocaleString("pt-BR"),
      tooltip: "Total de pedidos aprovados",
      icon: RiShoppingBagLine,
      subtitle: `Ticket Médio: ${fmtCompact(kpis.average_ticket)}`,
      variant: (hasData && kpis.total_sales > 0 ? "success" : "default") as const,
    },
    {
      title: "Margem de Lucro",
      value: `${profitMargin.toFixed(1)}%`,
      tooltip: "Margem percentual de lucro",
      icon: RiPercentLine,
      variant: (hasData && profitMargin < 0 ? "destructive" : "default") as const,
    },
    {
      title: "Taxa de Conversão",
      value: `${kpis.conversion_rate}%`,
      tooltip: "Taxa de conversão de cliques para vendas",
      icon: RiCursorLine,
      subtitle: `${kpis.total_clicks.toLocaleString("pt-BR")} cliques`,
      variant: "default" as const,
    },
    {
      title: "Chargebacks",
      value: fmtCompact(kpis.chargeback_amount),
      rawValue: kpis.chargeback_amount,
      tooltip: "Total e percentual de chargebacks",
      icon: RiErrorWarningLine,
      subtitle: `Taxa: ${kpis.chargeback_rate}%`,
      variant: (hasData && kpis.chargeback_amount > 0 ? "destructive" : "default") as const,
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {kpiCards.map((kpi) => (
        <KpiCard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
}
