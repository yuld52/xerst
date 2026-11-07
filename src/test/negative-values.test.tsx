import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { isNegativeValue, negativeTextClass } from "@/utils/value-color";
import {
  getCellValue,
  getFooterValue,
  type MetricRow,
} from "@/features/lomustrack/campaigns/components/campaignCellHelpers";
import { CampaignsKpis } from "@/features/lomustrack/campaigns/components/CampaignsKpis";
import { KpiGrid } from "@/features/lomustrack/dashboard/components/KpiGrid";
import type { DashboardKpis } from "@/types/dashboard";
import type { KpiColorsConfig } from "@/types/company";

const RED = "text-destructive";

function metricRow(overrides: Partial<MetricRow> = {}): MetricRow {
  return {
    name: "Campanha Teste",
    spend: 1000,
    revenue: 500,
    sales: 1,
    roas: 0.5,
    cpa: 100,
    cpc: 2,
    clicks: 100,
    impressions: 1000,
    ctr: 10,
    landingPageViews: 50,
    initiateCheckout: 10,
    connectRate: 50,
    profit: -500,
    budget: 1000,
    playsVsl: 0,
    playRate: 0,
    ...overrides,
  };
}

/** Reads the class of the value <p> that sits under a card label. */
function valueClassUnder(container: HTMLElement, label: string): string {
  const labelEl = Array.from(container.querySelectorAll("p")).find(
    (p) => p.textContent?.trim() === label,
  );
  return labelEl?.nextElementSibling?.className ?? "";
}

describe("Negative profit and ROAS read red", () => {
  it("flags only real negative numbers", () => {
    expect(isNegativeValue(-0.01)).toBe(true);
    expect(isNegativeValue(0)).toBe(false);
    expect(isNegativeValue(3.2)).toBe(false);
    expect(isNegativeValue(Number.NaN)).toBe(false);
    expect(negativeTextClass(-12)).toBe(RED);
    expect(negativeTextClass(0)).toBe("");
    expect(negativeTextClass(12)).toBe("");
  });

  it("paints a negative profit cell red and a positive one green", () => {
    const loss = render(<div>{getCellValue(metricRow({ profit: -500 }), "profit", null)}</div>);
    expect(loss.container.textContent).toContain("500");
    expect(loss.container.querySelector("span")?.className).toContain(RED);

    const gain = render(<div>{getCellValue(metricRow({ profit: 500 }), "profit", null)}</div>);
    expect(gain.container.querySelector("span")?.className).not.toContain(RED);
    expect(gain.container.querySelector("span")?.className).toContain("--color-success");
  });

  it("paints a negative ROAS red even when the KPI colour config says green", () => {
    const alwaysGreen: KpiColorsConfig = {
      roas: { green: { min: -100 }, yellow: {}, red: {} },
      cpa: null,
      ctr: null,
      cpc: null,
    };
    const { container } = render(
      <div>{getCellValue(metricRow({ roas: -0.75 }), "roas", alwaysGreen)}</div>,
    );
    const span = container.querySelector("span");
    expect(span?.textContent).toBe("-0.75x");
    expect(span?.className).toContain(RED);

    const healthy = render(
      <div>{getCellValue(metricRow({ roas: 4.2 }), "roas", alwaysGreen)}</div>,
    );
    expect(healthy.container.querySelector("span")?.className).not.toContain(RED);
  });

  it("paints the table footer totals red when the period is a loss", () => {
    const rows = [
      metricRow({ profit: -800, revenue: -400, roas: -0.8 }),
      metricRow({ profit: -200, revenue: -100, roas: -0.2 }),
    ];
    const loss = render(<div>{getFooterValue(rows, "profit")}</div>);
    expect(loss.container.querySelector("span")?.className).toContain(RED);

    const roasLoss = render(<div>{getFooterValue(rows, "roas")}</div>);
    expect(roasLoss.container.querySelector("span")?.className).toContain(RED);

    const profit = render(
      <div>
        {getFooterValue([metricRow({ profit: 800 }), metricRow({ profit: 200 })], "profit")}
      </div>,
    );
    expect(profit.container.querySelector("span")?.className).not.toContain(RED);
  });

  it("paints the campaigns KPI strip red for Lucro and ROAS", () => {
    const { container } = render(
      <CampaignsKpis data={[metricRow({ profit: -500, revenue: -500, roas: -0.5 })]} />,
    );
    expect(valueClassUnder(container, "Lucro")).toContain(RED);
    expect(valueClassUnder(container, "ROAS")).toContain(RED);

    const healthy = render(
      <CampaignsKpis data={[metricRow({ profit: 500, revenue: 2500, roas: 2.5 })]} />,
    );
    expect(valueClassUnder(healthy.container, "Lucro")).not.toContain(RED);
    expect(valueClassUnder(healthy.container, "ROAS")).not.toContain(RED);
  });

  it("paints the dashboard Lucro and ROAS cards red when negative", () => {
    const kpis: DashboardKpis = {
      total_revenue: -500,
      total_spend: 1000,
      profit: -900,
      total_sales: 0,
      average_ticket: 0,
      cpa: 0,
      roas: -0.5,
      profit_margin: -100,
      conversion_rate: 0,
      total_clicks: 0,
      chargeback_amount: 0,
      chargeback_rate: 0,
      refunded_count: 0,
      chargeback_count: 0,
    };
    const { container } = render(
      <KpiGrid
        kpis={kpis}
        taxEnabled={false}
        taxRate={0}
        opCostsEnabled={false}
        opCostsTotal={0}
      />,
    );
    expect(valueClassUnder(container, "Lucro")).toContain(RED);
    expect(valueClassUnder(container, "ROAS")).toContain(RED);

    const healthy: DashboardKpis = {
      ...kpis,
      total_revenue: 5000,
      profit: 900,
      roas: 5,
      profit_margin: 18,
    };
    const ok = render(
      <KpiGrid
        kpis={healthy}
        taxEnabled={false}
        taxRate={0}
        opCostsEnabled={false}
        opCostsTotal={0}
      />,
    );
    expect(valueClassUnder(ok.container, "Lucro")).not.toContain(RED);
    expect(valueClassUnder(ok.container, "ROAS")).not.toContain(RED);
    expect(valueClassUnder(ok.container, "Margem de Lucro")).not.toContain(RED);
  });

  it("paints the dashboard Margem de Lucro red when spending beats revenue", () => {
    const kpis: DashboardKpis = {
      total_revenue: 500,
      total_spend: 1000,
      profit: -900,
      total_sales: 0,
      average_ticket: 0,
      cpa: 0,
      roas: 0.5,
      profit_margin: -180,
      conversion_rate: 0,
      total_clicks: 0,
      chargeback_amount: 0,
      chargeback_rate: 0,
      refunded_count: 0,
      chargeback_count: 0,
    };
    const { container } = render(
      <KpiGrid
        kpis={kpis}
        taxEnabled={false}
        taxRate={0}
        opCostsEnabled={false}
        opCostsTotal={0}
      />,
    );
    expect(valueClassUnder(container, "Lucro")).toContain(RED);
    expect(valueClassUnder(container, "Margem de Lucro")).toContain(RED);
  });
});
