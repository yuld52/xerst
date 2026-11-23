// ── Dashboard Grid Component ──────────────────────────────

import { useMemo, useRef } from "react";
import { ResponsiveGridLayout, useContainerWidth, type Layout } from "react-grid-layout";
import type { WidgetConfig } from "../types/widget";
import { WidgetWrapper } from "./WidgetWrapper";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface DashboardGridProps {
  widgets: WidgetConfig[];
  isEditing: boolean;
  onLayoutChange: (layouts: Layout[]) => void;
  // Data props to pass to widgets
  kpis?: any;
  data?: any;
  settings?: any;
  filters?: any;
  taxEnabled?: boolean;
  taxRate?: number;
  opCostsEnabled?: boolean;
  opCostsTotal?: number;
  onRemoveWidget?: (id: string) => void;
  onConfigureWidget?: (id: string) => void;
}

export function DashboardGrid({
  widgets,
  isEditing,
  onLayoutChange,
  kpis,
  data,
  settings,
  filters,
  taxEnabled,
  taxRate,
  opCostsEnabled,
  opCostsTotal,
  onRemoveWidget,
  onConfigureWidget,
}: DashboardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useContainerWidth(containerRef);

  // Convert widgets to react-grid-layout format
  const layouts = useMemo(() => {
    const layoutArray: Layout[] = widgets.map((widget) => ({
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.size.w,
      h: widget.size.h,
      minW: 2,
      minH: 2,
    }));

    return {
      lg: layoutArray,
      md: layoutArray.map((l) => ({ ...l, w: Math.min(l.w, 8) })),
      sm: layoutArray.map((l) => ({ ...l, w: Math.min(l.w, 6) })),
      xs: layoutArray.map((l) => ({ ...l, w: 12, h: l.h })), // Full width on mobile
    };
  }, [widgets]);

  const handleLayoutChange = (_currentLayout: Layout[], allLayouts: any) => {
    // Only process changes in edit mode
    if (!isEditing) return;

    // Use the lg (desktop) layout as the source of truth
    const lgLayout = allLayouts.lg || _currentLayout;
    onLayoutChange(lgLayout);
  };

  if (widgets.length === 0) {
    return (
      <div ref={containerRef} className="flex items-center justify-center h-[400px] rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/5">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-sm">
            Arraste métricas da barra lateral para começar
          </p>
          {!isEditing && (
            <p className="text-muted-foreground/70 text-xs">
              Clique no botão de editar para personalizar seu dashboard
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <ResponsiveGridLayout
        className="dashboard-grid"
        layouts={layouts}
        width={width}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 8, sm: 6, xs: 1 }}
        rowHeight={80}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditing}
        isResizable={isEditing}
        draggableHandle=".drag-handle"
        compactType="vertical"
        preventCollision={false}
        margin={[12, 12]}
        containerPadding={[0, 0]}
      >
        {widgets.map((widget) => (
          <div key={widget.id} className={isEditing ? "group" : ""}>
            <div className={isEditing ? "drag-handle cursor-move" : ""}>
              <WidgetWrapper
                widget={widget}
                isEditMode={isEditing}
                onRemove={onRemoveWidget}
                onConfigure={onConfigureWidget}
                kpis={kpis}
                data={data}
                settings={settings}
                filters={filters}
                taxEnabled={taxEnabled}
                taxRate={taxRate}
                opCostsEnabled={opCostsEnabled}
                opCostsTotal={opCostsTotal}
              />
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
