// ── Widget Registry ────────────────────────────────────────

import { WidgetType, type WidgetMetadata } from "../types/widget";
import { KpiGrid } from "../components/KpiGrid";
import { RevenueChart } from "../components/RevenueChart";
import { PaymentMethodChart } from "../components/PaymentMethodChart";
import { HourlySalesChart } from "../components/HourlySalesChart";
import { SalesByCountryCard } from "../components/SalesByCountryCard";
import { TopCampaigns } from "../components/TopCampaigns";

export const WIDGET_REGISTRY: Record<WidgetType, WidgetMetadata> = {
  [WidgetType.KPI]: {
    title: "Resumo (KPIs)",
    category: "general",
    defaultSize: { w: 12, h: 2 },
    description: "Principais indicadores: faturamento, gastos, ROAS, lucro, vendas",
    component: KpiGrid,
  },
  [WidgetType.REVENUE_CHART]: {
    title: "Faturamento Líquido",
    category: "charts",
    defaultSize: { w: 6, h: 4 },
    description: "Gráfico de evolução diária de faturamento, investimento e lucro",
    component: RevenueChart,
  },
  [WidgetType.PAYMENT_METHOD_CHART]: {
    title: "Meios de Pagamento",
    category: "charts",
    defaultSize: { w: 3, h: 3 },
    description: "Distribuição de vendas por método de pagamento",
    component: PaymentMethodChart,
  },
  [WidgetType.HOURLY_SALES_CHART]: {
    title: "Vendas por Horário",
    category: "charts",
    defaultSize: { w: 3, h: 3 },
    description: "Horários de pico de vendas no período",
    component: HourlySalesChart,
  },
  [WidgetType.SALES_BY_COUNTRY]: {
    title: "Vendas por País",
    category: "charts",
    defaultSize: { w: 6, h: 4 },
    description: "Mapa e ranking de vendas por país",
    component: SalesByCountryCard,
  },
  [WidgetType.TOP_CAMPAIGNS]: {
    title: "Top Campanhas",
    category: "rankings",
    defaultSize: { w: 3, h: 3 },
    description: "Campanhas com melhor desempenho no período",
    component: TopCampaigns,
  },
};

// Helper function to get widget metadata
export function getWidgetMetadata(type: WidgetType): WidgetMetadata | undefined {
  return WIDGET_REGISTRY[type];
}

// Helper function to get all widget types for a category
export function getWidgetTypesByCategory(category: string): WidgetType[] {
  return Object.entries(WIDGET_REGISTRY)
    .filter(([_, metadata]) => metadata.category === category)
    .map(([type]) => type as WidgetType);
}
