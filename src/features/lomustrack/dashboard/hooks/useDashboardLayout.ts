// ── Dashboard Layout Hook ─────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { WidgetType, type WidgetConfig } from "../types/widget";
import { getWidgetMetadata } from "../config/widget-registry";

const STORAGE_KEY_V2 = "dashboard-layout-v2";
const STORAGE_KEY_V1 = "dashboard-config";

interface DashboardLayoutV2 {
  widgets: WidgetConfig[];
  version: 2;
}

interface DashboardConfigV1 {
  activeCards: string[];
  availableCards: string[];
}

// Map old card IDs to new WidgetType enum
const CARD_ID_TO_WIDGET_TYPE: Record<string, WidgetType> = {
  kpis: WidgetType.KPI,
  revenueChart: WidgetType.REVENUE_CHART,
  paymentMethodChart: WidgetType.PAYMENT_METHOD_CHART,
  hourlySalesChart: WidgetType.HOURLY_SALES_CHART,
  salesByCountry: WidgetType.SALES_BY_COUNTRY,
  topCampaigns: WidgetType.TOP_CAMPAIGNS,
};

// Default layout when no stored layout exists
const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    id: "kpis-1",
    type: WidgetType.KPI,
    title: "Resumo (KPIs)",
    position: { x: 0, y: 0 },
    size: { w: 12, h: 2 },
  },
  {
    id: "revenueChart-1",
    type: WidgetType.REVENUE_CHART,
    title: "Faturamento Líquido",
    position: { x: 0, y: 2 },
    size: { w: 6, h: 4 },
  },
  {
    id: "paymentMethodChart-1",
    type: WidgetType.PAYMENT_METHOD_CHART,
    title: "Meios de Pagamento",
    position: { x: 6, y: 2 },
    size: { w: 3, h: 3 },
  },
  {
    id: "topCampaigns-1",
    type: WidgetType.TOP_CAMPAIGNS,
    title: "Top Campanhas",
    position: { x: 9, y: 2 },
    size: { w: 3, h: 3 },
  },
  {
    id: "hourlySalesChart-1",
    type: WidgetType.HOURLY_SALES_CHART,
    title: "Vendas por Horário",
    position: { x: 6, y: 5 },
    size: { w: 3, h: 3 },
  },
  {
    id: "salesByCountry-1",
    type: WidgetType.SALES_BY_COUNTRY,
    title: "Vendas por País",
    position: { x: 0, y: 6 },
    size: { w: 6, h: 4 },
  },
];

/**
 * Migrate old V1 dashboard config to new V2 widget layout
 */
function migrateV1ToV2(v1Config: DashboardConfigV1): WidgetConfig[] {
  const widgets: WidgetConfig[] = [];
  let currentY = 0;

  v1Config.activeCards.forEach((cardId, index) => {
    const widgetType = CARD_ID_TO_WIDGET_TYPE[cardId];
    if (!widgetType) return;

    const metadata = getWidgetMetadata(widgetType);
    if (!metadata) return;

    const size = metadata.defaultSize;
    
    // Auto-layout: place widgets sequentially
    // If widget is full-width (12 cols), start new row
    // Otherwise, try to fit in current row
    let x = 0;
    if (index > 0 && size.w < 12) {
      const prevWidget = widgets[index - 1];
      if (prevWidget && prevWidget.position.y === currentY) {
        const potentialX = prevWidget.position.x + prevWidget.size.w;
        if (potentialX + size.w <= 12) {
          x = potentialX;
        } else {
          currentY += prevWidget.size.h;
        }
      }
    }

    widgets.push({
      id: `${cardId}-${index + 1}`,
      type: widgetType,
      title: metadata.title,
      position: { x, y: currentY },
      size,
    });

    // Move to next row if this widget fills the width
    if (x + size.w >= 12) {
      currentY += size.h;
    }
  });

  return widgets;
}

/**
 * Load dashboard layout from localStorage
 */
function loadLayout(): WidgetConfig[] {
  try {
    // Try loading V2 format first
    const v2Json = localStorage.getItem(STORAGE_KEY_V2);
    if (v2Json) {
      const v2Data: DashboardLayoutV2 = JSON.parse(v2Json);
      if (v2Data.version === 2 && Array.isArray(v2Data.widgets)) {
        return v2Data.widgets;
      }
    }

    // Try migrating from V1 format
    const v1Json = localStorage.getItem(STORAGE_KEY_V1);
    if (v1Json) {
      const v1Data: DashboardConfigV1 = JSON.parse(v1Json);
      if (Array.isArray(v1Data.activeCards)) {
        const migratedWidgets = migrateV1ToV2(v1Data);
        // Save migrated layout to V2 format
        saveLayout(migratedWidgets);
        return migratedWidgets;
      }
    }
  } catch (error) {
    console.error("Failed to load dashboard layout:", error);
  }

  // Return default layout
  return DEFAULT_WIDGETS;
}

/**
 * Save dashboard layout to localStorage
 */
function saveLayout(widgets: WidgetConfig[]): void {
  try {
    const layout: DashboardLayoutV2 = {
      widgets,
      version: 2,
    };
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(layout));
  } catch (error) {
    console.error("Failed to save dashboard layout:", error);
  }
}

/**
 * Hook for managing dashboard widget layout
 */
export function useDashboardLayout() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => loadLayout());

  // Persist changes to localStorage
  useEffect(() => {
    saveLayout(widgets);
  }, [widgets]);

  const addWidget = useCallback((type: WidgetType) => {
    const metadata = getWidgetMetadata(type);
    if (!metadata) return;

    // Find next available position
    const maxY = Math.max(...widgets.map((w) => w.position.y + w.size.h), 0);

    const newWidget: WidgetConfig = {
      id: `${type}-${Date.now()}`,
      type,
      title: metadata.title,
      position: { x: 0, y: maxY },
      size: metadata.defaultSize,
    };

    setWidgets((prev) => [...prev, newWidget]);
  }, [widgets]);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const updateWidget = useCallback((id: string, updates: Partial<WidgetConfig>) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  }, []);

  const resetToDefault = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
  }, []);

  return {
    widgets,
    addWidget,
    removeWidget,
    updateWidget,
    resetToDefault,
  };
}
