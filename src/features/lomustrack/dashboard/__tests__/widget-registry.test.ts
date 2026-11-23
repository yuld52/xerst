// ── Widget Registry Tests ─────────────────────────────────

import { describe, it, expect } from "vitest";
import { WIDGET_REGISTRY, getWidgetMetadata, getWidgetTypesByCategory } from "../config/widget-registry";
import { WidgetType } from "../types/widget";

describe("Widget Registry", () => {
  it("contains all 6 widget types", () => {
    const widgetTypes = Object.keys(WIDGET_REGISTRY);
    expect(widgetTypes).toHaveLength(6);
    
    // Verify all expected widget types are present
    expect(widgetTypes).toContain(WidgetType.KPI);
    expect(widgetTypes).toContain(WidgetType.REVENUE_CHART);
    expect(widgetTypes).toContain(WidgetType.PAYMENT_METHOD_CHART);
    expect(widgetTypes).toContain(WidgetType.HOURLY_SALES_CHART);
    expect(widgetTypes).toContain(WidgetType.SALES_BY_COUNTRY);
    expect(widgetTypes).toContain(WidgetType.TOP_CAMPAIGNS);
  });

  it("each widget has valid metadata with required fields", () => {
    Object.entries(WIDGET_REGISTRY).forEach(([type, metadata]) => {
      // Check required fields exist
      expect(metadata).toHaveProperty("title");
      expect(metadata).toHaveProperty("category");
      expect(metadata).toHaveProperty("defaultSize");
      expect(metadata).toHaveProperty("component");

      // Check title is not empty
      expect(metadata.title).toBeTruthy();
      expect(typeof metadata.title).toBe("string");

      // Check category is not empty
      expect(metadata.category).toBeTruthy();
      expect(typeof metadata.category).toBe("string");

      // Check defaultSize has valid w and h
      expect(metadata.defaultSize).toHaveProperty("w");
      expect(metadata.defaultSize).toHaveProperty("h");
      expect(typeof metadata.defaultSize.w).toBe("number");
      expect(typeof metadata.defaultSize.h).toBe("number");
      expect(metadata.defaultSize.w).toBeGreaterThan(0);
      expect(metadata.defaultSize.h).toBeGreaterThan(0);

      // Check component exists
      expect(metadata.component).toBeDefined();
    });
  });

  it("default sizes are reasonable grid dimensions", () => {
    Object.entries(WIDGET_REGISTRY).forEach(([type, metadata]) => {
      const { w, h } = metadata.defaultSize;

      // Width should be between 1 and 12 (12-column grid)
      expect(w).toBeGreaterThanOrEqual(1);
      expect(w).toBeLessThanOrEqual(12);

      // Height should be reasonable (between 1 and 10 rows)
      expect(h).toBeGreaterThanOrEqual(1);
      expect(h).toBeLessThanOrEqual(10);

      // KPI widget should span full width
      if (type === WidgetType.KPI) {
        expect(w).toBe(12);
      }
    });
  });

  it("widgets are correctly categorized", () => {
    // Check general category
    expect(WIDGET_REGISTRY[WidgetType.KPI].category).toBe("general");

    // Check charts category
    expect(WIDGET_REGISTRY[WidgetType.REVENUE_CHART].category).toBe("charts");
    expect(WIDGET_REGISTRY[WidgetType.PAYMENT_METHOD_CHART].category).toBe("charts");
    expect(WIDGET_REGISTRY[WidgetType.HOURLY_SALES_CHART].category).toBe("charts");
    expect(WIDGET_REGISTRY[WidgetType.SALES_BY_COUNTRY].category).toBe("charts");

    // Check rankings category
    expect(WIDGET_REGISTRY[WidgetType.TOP_CAMPAIGNS].category).toBe("rankings");
  });

  it("getWidgetMetadata returns correct metadata for valid type", () => {
    const kpiMetadata = getWidgetMetadata(WidgetType.KPI);
    expect(kpiMetadata).toBeDefined();
    expect(kpiMetadata?.title).toBe("Resumo (KPIs)");
    expect(kpiMetadata?.category).toBe("general");
  });

  it("getWidgetMetadata returns undefined for invalid type", () => {
    const invalidMetadata = getWidgetMetadata("invalid-type" as WidgetType);
    expect(invalidMetadata).toBeUndefined();
  });

  it("getWidgetTypesByCategory returns correct widgets for each category", () => {
    const generalWidgets = getWidgetTypesByCategory("general");
    expect(generalWidgets).toHaveLength(1);
    expect(generalWidgets).toContain(WidgetType.KPI);

    const chartWidgets = getWidgetTypesByCategory("charts");
    expect(chartWidgets).toHaveLength(4);
    expect(chartWidgets).toContain(WidgetType.REVENUE_CHART);
    expect(chartWidgets).toContain(WidgetType.PAYMENT_METHOD_CHART);
    expect(chartWidgets).toContain(WidgetType.HOURLY_SALES_CHART);
    expect(chartWidgets).toContain(WidgetType.SALES_BY_COUNTRY);

    const rankingWidgets = getWidgetTypesByCategory("rankings");
    expect(rankingWidgets).toHaveLength(1);
    expect(rankingWidgets).toContain(WidgetType.TOP_CAMPAIGNS);
  });

  it("getWidgetTypesByCategory returns empty array for non-existent category", () => {
    const noWidgets = getWidgetTypesByCategory("non-existent");
    expect(noWidgets).toHaveLength(0);
  });

  it("all widgets have descriptions", () => {
    Object.entries(WIDGET_REGISTRY).forEach(([type, metadata]) => {
      expect(metadata.description).toBeDefined();
      expect(typeof metadata.description).toBe("string");
      expect(metadata.description!.length).toBeGreaterThan(0);
    });
  });
});
