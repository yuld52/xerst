export interface FunnelStageMeta {
  impressions?: number;
  ctr?: number;
  cpm?: number;
  cpc?: number;
  spend?: number;
}

export interface FunnelStage {
  name: string;
  value: number;
  revenue?: number;
  meta?: FunnelStageMeta;
}

export interface FunnelData {
  productId: string;
  productName: string;
  stages: FunnelStage[];
}

export const funnelData: FunnelData[] = [
  {
    productId: "p1",
    productName: "Ebook Fitness Premium",
    stages: [
      { name: "Cliques", value: 4594, meta: { ctr: 3.02, cpc: 0.61, spend: 2814.0 } },
      { name: "Landing Page Views", value: 3980 },
      { name: "Iniciação de Compra", value: 312 },
      { name: "Vendas", value: 189, revenue: 18523.0 },
      { name: "Order Bump", value: 85, revenue: 2975.0 },
      { name: "Upsell Premium", value: 42, revenue: 8274.0 },
    ],
  },
  {
    productId: "p2",
    productName: "Curso Marketing Digital",
    stages: [
      { name: "Cliques", value: 5802, meta: { ctr: 2.93, cpc: 0.54, spend: 3128.0 } },
      { name: "Landing Page Views", value: 5100 },
      { name: "Iniciação de Compra", value: 420 },
      { name: "Vendas", value: 234, revenue: 32760.0 },
      { name: "Order Bump", value: 110, revenue: 5500.0 },
      { name: "Upsell Gold", value: 55, revenue: 13750.0 },
      { name: "Upsell Mentoria", value: 38, revenue: 18620.0 },
    ],
  },
  {
    productId: "p3",
    productName: "Mentoria Premium",
    stages: [
      { name: "Cliques", value: 3827, meta: { ctr: 3.33, cpc: 0.66, spend: 2541.0 } },
      { name: "Landing Page Views", value: 3400 },
      { name: "Iniciação de Compra", value: 198 },
      { name: "Vendas", value: 124, revenue: 49104.0 },
      { name: "Upsell VIP", value: 18, revenue: 17640.0 },
    ],
  },
];
