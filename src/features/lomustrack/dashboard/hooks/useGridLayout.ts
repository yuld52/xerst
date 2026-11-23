// ── Grid Layout Hook ──────────────────────────────────────

import { useCallback } from "react";
import type { Layout } from "react-grid-layout";
import { useDashboardLayout } from "./useDashboardLayout";
import type { WidgetType, WidgetConfig } from "../types/widget";
import { getWidgetMetadata } from "../config/widget-registry";

export function useGridLayout() {
  const { widgets, addWidget, removeWidget, updateWidget, resetToDefault } = useDashboardLayout();

  /**
   * Handle layout changes from react-grid-layout
   */
  const handleLayoutChange = useCallback(
    (layouts: Layout[]) => {
      layouts.forEach((layout) => {
        const widget = widgets.find((w) => w.id === layout.i);
        if (widget) {
          // Check if position or size changed
          const positionChanged =
            widget.position.x !== layout.x || widget.position.y !== layout.y;
          const sizeChanged =
            widget.size.w !== layout.w || widget.size.h !== layout.h;

          if (positionChanged || sizeChanged) {
            updateWidget(layout.i, {
              position: { x: layout.x, y: layout.y },
              size: { w: layout.w, h: layout.h },
            });
          }
        }
      });
    },
    [widgets, updateWidget]
  );

  /**
   * Find first available position in the grid
   */
  const findFirstAvailablePosition = useCallback(
    (width: number, height: number): { x: number; y: number } => {
      if (widgets.length === 0) {
        return { x: 0, y: 0 };
      }

      // Create a grid map to track occupied cells
      const maxY = Math.max(...widgets.map((w) => w.position.y + w.size.h));
      const gridMap: boolean[][] = Array(maxY + height + 5)
        .fill(null)
        .map(() => Array(12).fill(false));

      // Mark occupied cells
      widgets.forEach((w) => {
        for (let y = w.position.y; y < w.position.y + w.size.h; y++) {
          for (let x = w.position.x; x < w.position.x + w.size.w; x++) {
            if (gridMap[y] && gridMap[y][x] !== undefined) {
              gridMap[y][x] = true;
            }
          }
        }
      });

      // Find first position that fits the widget
      for (let y = 0; y < gridMap.length; y++) {
        for (let x = 0; x <= 12 - width; x++) {
          let fits = true;
          
          // Check if the widget fits at this position
          for (let dy = 0; dy < height && fits; dy++) {
            for (let dx = 0; dx < width && fits; dx++) {
              if (gridMap[y + dy] && gridMap[y + dy][x + dx]) {
                fits = false;
              }
            }
          }

          if (fits) {
            return { x, y };
          }
        }
      }

      // If no position found, place at the bottom
      const maxYPos = Math.max(...widgets.map((w) => w.position.y + w.size.h), 0);
      return { x: 0, y: maxYPos };
    },
    [widgets]
  );

  /**
   * Add a widget from the sidebar at the first available position
   */
  const handleAddWidgetFromSidebar = useCallback(
    (type: WidgetType, dropPosition?: { x: number; y: number }) => {
      const metadata = getWidgetMetadata(type);
      if (!metadata) return;

      const size = metadata.defaultSize;
      const position = dropPosition || findFirstAvailablePosition(size.w, size.h);

      const newWidget: WidgetConfig = {
        id: `${type}-${Date.now()}`,
        type,
        title: metadata.title,
        position,
        size,
      };

      // Use the addWidget from useDashboardLayout
      // But we need to add the widget with specific position, so we'll use updateWidget approach
      // Actually, let's just call addWidget and then update position
      addWidget(type);
      
      // The addWidget already handles the creation, but we need to update if dropPosition was provided
      if (dropPosition) {
        // Find the newly added widget and update its position
        setTimeout(() => {
          const latestWidget = widgets[widgets.length];
          if (latestWidget) {
            updateWidget(latestWidget.id, { position: dropPosition });
          }
        }, 0);
      }
    },
    [addWidget, findFirstAvailablePosition, widgets, updateWidget]
  );

  return {
    widgets,
    handleLayoutChange,
    handleAddWidgetFromSidebar,
    removeWidget,
    resetToDefault,
  };
}
