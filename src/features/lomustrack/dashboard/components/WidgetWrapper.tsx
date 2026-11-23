// ── Widget Wrapper Component ──────────────────────────────

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiSettings3Line, RiCloseLine } from "@remixicon/react";
import type { WidgetConfig } from "../types/widget";
import { getWidgetMetadata } from "../config/widget-registry";

interface WidgetWrapperProps {
  widget: WidgetConfig;
  isEditMode?: boolean;
  onRemove?: (id: string) => void;
  onConfigure?: (id: string) => void;
  // Data props
  kpis?: any;
  data?: any;
  settings?: any;
  filters?: any;
  taxEnabled?: boolean;
  taxRate?: number;
  opCostsEnabled?: boolean;
  opCostsTotal?: number;
}

export function WidgetWrapper({
  widget,
  isEditMode = false,
  onRemove,
  onConfigure,
  kpis,
  data,
  settings,
  filters,
  taxEnabled,
  taxRate,
  opCostsEnabled,
  opCostsTotal,
}: WidgetWrapperProps) {
  const metadata = getWidgetMetadata(widget.type);

  if (!metadata) {
    return (
      <Card className="rounded-lg bg-white dark:bg-card border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
          Widget type not found: {widget.type}
        </CardContent>
      </Card>
    );
  }

  const WidgetComponent = metadata.component;

  if (!WidgetComponent) {
    return (
      <Card className="rounded-lg bg-white dark:bg-card border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
          No component registered for: {widget.type}
        </CardContent>
      </Card>
    );
  }

  // Map widget types to their specific props
  const getWidgetProps = () => {
    switch (widget.type) {
      case "kpi":
        return {
          kpis: kpis || {},
          taxEnabled: taxEnabled ?? false,
          taxRate: taxRate ?? 0,
          opCostsEnabled: opCostsEnabled ?? false,
          opCostsTotal: opCostsTotal ?? 0,
        };
      case "revenueChart":
        return {
          data: data?.daily_revenue || [],
        };
      case "paymentMethodChart":
        return {
          data: data?.payment_distribution || [],
        };
      case "hourlySalesChart":
        return {
          data: data?.hourly_sales || [],
        };
      case "salesByCountry":
        return {
          startDate: filters?.dateStart,
          endDate: filters?.dateEnd,
        };
      case "topCampaigns":
        return {
          data: data?.top_campaigns || [],
        };
      default:
        return {};
    }
  };

  const widgetProps = getWidgetProps();

  // If widget has its own Card wrapper, render directly
  // Otherwise, wrap in a Card with header
  const hasOwnCard = [
    "revenueChart",
    "paymentMethodChart",
    "hourlySalesChart",
    "salesByCountry",
    "topCampaigns",
  ].includes(widget.type);

  if (hasOwnCard) {
    return (
      <div className="relative h-full w-full">
        {isEditMode && (
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            {onConfigure && (
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onConfigure(widget.id)}
              >
                <RiSettings3Line className="h-3.5 w-3.5" />
              </Button>
            )}
            {onRemove && (
              <Button
                size="icon"
                variant="destructive"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(widget.id)}
              >
                <RiCloseLine className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
        <WidgetComponent {...widgetProps} />
      </div>
    );
  }

  // For widgets without their own card (like KpiGrid)
  return (
    <div className="relative h-full w-full group">
      {isEditMode && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {onConfigure && (
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onConfigure(widget.id)}
            >
              <RiSettings3Line className="h-3.5 w-3.5" />
            </Button>
          )}
          {onRemove && (
            <Button
              size="icon"
              variant="destructive"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(widget.id)}
            >
              <RiCloseLine className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
      <WidgetComponent {...widgetProps} />
    </div>
  );
}
