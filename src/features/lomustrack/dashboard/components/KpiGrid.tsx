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
      value: fmtCompact(revenue).replace(/\s*MT\b/gi, ""),
      rawValue: revenue,
      tooltip: "Faturamento Líquido total",
      icon: RiMoneyDollarBoxLine,
      variant: "primary" as const,
    },
    {
      title: "Gastos com anúncios",
      value: fmtCompact(kpis.total_spend).replace(/\s*MT\b/gi, ""),
      rawValue: kpis.total_spend,
      tooltip: "Total investido em anúncios",
      icon: RiBarChartLine,
      subtitle: kpis.cpa > 0 ? `CPA: ${fmtCompact(kpis.cpa).replace(/\s*MT\b/gi, "")}` : undefined,
      variant: "default" as const,
    },
    {
      title: "ROAS",
      value: kpis.total_spend > 0 ? `${roas.toFixed(2)}x` : "N/A",
      tooltip: "Retorno sobre gastos com anúncios (Receita / Gasto)",
      icon: RiFocus3Line,
      variant: roas < 0 ? ("destructive" as const) : ("primary" as const),
    },
    {
      title: profitLabel,
      value: fmtCompact(profit).replace(/\s*MT\b/gi, ""),
      rawValue: profit,
      tooltip: "Lucro líquido final",
      icon: RiLineChartLine,
      variant: profit >= 0 ? ("success" as const) : ("destructive" as const),
    },
    {
      title: "Vendas",
      value: kpis.total_sales.toLocaleString("pt-BR"),
      tooltip: "Total de pedidos aprovados",
      icon: RiShoppingBagLine,
      subtitle: `Ticket Médio: ${fmtCompact(kpis.average_ticket).replace(/\s*MT\b/gi, "")}`,
      variant: "success" as const,
    },
    {
      title: "Margem de Lucro",
      value: `${profitMargin.toFixed(1)}%`,
      tooltip: "Margem percentual de lucro",
      icon: RiPercentLine,
      variant: profitMargin < 0 ? ("destructive" as const) : ("default" as const),
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
      value: fmtCompact(kpis.chargeback_amount).replace(/\s*MT\b/gi, ""),
      rawValue: kpis.chargeback_amount,
      tooltip: "Total e percentual de chargebacks",
      icon: RiErrorWarningLine,
      subtitle: `Taxa: ${kpis.chargeback_rate}%`,
      variant: "destructive" as const,
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
