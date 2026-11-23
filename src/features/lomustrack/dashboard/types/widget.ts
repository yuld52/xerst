// ── Widget Type System ────────────────────────────────────

export enum WidgetType {
  KPI = "kpi",
  REVENUE_CHART = "revenueChart",
  PAYMENT_METHOD_CHART = "paymentMethodChart",
  HOURLY_SALES_CHART = "hourlySalesChart",
  SALES_BY_COUNTRY = "salesByCountry",
  TOP_CAMPAIGNS = "topCampaigns",
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  w: number; // width in grid columns
  h: number; // height in grid rows
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  config?: Record<string, unknown>;
}

export interface WidgetMetadata {
  title: string;
  category: string;
  icon?: string;
  defaultSize: WidgetSize;
  description?: string;
  component?: React.ComponentType<any>;
}

export interface WidgetProps {
  widget: WidgetConfig;
  isEditMode?: boolean;
  onRemove?: (id: string) => void;
  onConfigure?: (id: string) => void;
  // Data props passed from parent dashboard
  data?: any;
  settings?: any;
  filters?: any;
}
