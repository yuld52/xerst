# LomusTrack Custom Dashboard Builder — Implementation Plan

## Executive Summary

This plan outlines the complete implementation of a customizable Dashboard Builder for LomusTrack, transforming the existing static dashboard into a fully interactive, drag-and-drop widget system. The implementation builds upon the existing dashboard architecture and design system, extending it with professional grid layout capabilities, widget management, and persistent customization.

**Current State**: LomusTrack has a functional dashboard at `/dashboard` with 6 widget types (KPIs, Revenue Chart, Payment Methods, Hourly Sales, Sales by Country, Top Campaigns). A basic DashboardEditor sidebar exists that allows reordering widgets in a list, but widgets render as fixed sequential blocks without positioning or resizing capabilities.

**Target State**: Users can customize their dashboard by dragging widgets from a sidebar directly onto a 12-column grid, repositioning and resizing them, configuring widget properties, and persisting their personalized layout.

---

## Architecture Analysis

### Existing Dashboard Structure

**Location**: `src/features/lomustrack/dashboard/`

**Key Files**:
- `index.tsx` — Main dashboard page component
- `components/DashboardEditor.tsx` — Sidebar with widget categories and @dnd-kit reordering
- `components/KpiGrid.tsx` — Renders 8 KPI cards (revenue, spend, ROAS, profit, sales, margin, conversion, chargebacks)
- `components/KpiCard.tsx` — Individual KPI card component
- `components/RevenueChart.tsx` — Area chart showing revenue/spend/profit over time
- `components/HourlySalesChart.tsx` — Bar chart of sales by hour
- `components/PaymentMethodChart.tsx` — Payment methods distribution chart
- `components/TopCampaigns.tsx` — Top campaigns table/chart
- `components/SalesByCountryCard.tsx` — Sales by country visualization
- `components/DashboardHeader.tsx` — Dashboard title and refresh button

**Data Flow**:
1. `useDashboard()` hook fetches data from `/dashboard/overview` API endpoint
2. Returns `DashboardOverview` with `kpis`, `daily_revenue`, `payment_distribution`, `top_campaigns`, `hourly_sales` arrays
3. Components receive data slices as props and render visualizations using Recharts
4. Filters managed by `GlobalFilterBar` component (date range, product, platform, account)

**Current Widget System**:
- `DashboardConfig` interface: `{ activeCards: string[], availableCards: string[] }`
- Stored in `localStorage` under key `'dashboard-config'`
- Widget IDs: `"kpis"`, `"revenueChart"`, `"paymentMethodChart"`, `"topCampaigns"`, `"hourlySalesChart"`, `"salesByCountry"`
- Renders widgets sequentially in order of `activeCards` array
- No position/size information — just rendering order

**Current Drag-and-Drop**:
- Uses `@dnd-kit/core` and `@dnd-kit/sortable` (already in dependencies)
- `DashboardEditor.tsx` implements sortable list for reordering activeCards
- Sidebar opens as Sheet (drawer) on left side
- Categories: "Geral", "Gráficos Avançados", "Rankings"
- Cannot drag widgets onto grid canvas — only reorder in sidebar list

### Design System Components

**UI Library**: Custom components in `src/components/ui/` using Radix UI primitives

**Key Components**:
- `Card` — Base card component with header/content/footer slots
- `Sheet` — Slide-in drawer (used for sidebar)
- `Button` — Button with variants (default, outline, ghost, destructive, etc.)
- `Dialog` / `AlertDialog` — Modal dialogs
- `Collapsible` — Accordion component (used for sidebar categories)
- `Select`, `Input` — Form controls

**Styling**: Tailwind CSS v4.2.1 with custom design tokens. Cards use:
- Background: `bg-white dark:bg-card`
- Border: `border border-slate-200/80 dark:border-white/[0.08]`
- Shadow: `shadow-sm`
- Radius: `rounded-lg` or `rounded-xl`

### Dependencies Analysis

**Already Available**:
- `@dnd-kit/core` ^6.3.1 — Core drag-and-drop primitives
- `@dnd-kit/sortable` ^10.0.0 — Sortable list utilities
- `@dnd-kit/utilities` ^3.2.2 — Helper utilities
- `react-grid-layout` ^2.3.0 — Grid layout system (installed but not used)
- `@types/react-grid-layout` — TypeScript definitions (in devDependencies)
- `recharts` ^2.15.4 — Charting library (used by all charts)
- `framer-motion` ^14.14.0 — Animation library (available for transitions)

**No Additional Dependencies Required** — All necessary libraries are already installed.

---

## Proposed Widget System Architecture

### Widget Type Definitions

```typescript
// src/features/lomustrack/dashboard/types/widget.ts

export enum WidgetType {
  KPI = 'kpi',
  REVENUE_CHART = 'revenueChart',
  PAYMENT_METHOD_CHART = 'paymentMethodChart',
  HOURLY_SALES_CHART = 'hourlySalesChart',
  SALES_BY_COUNTRY = 'salesByCountry',
  TOP_CAMPAIGNS = 'topCampaigns',
}

export interface WidgetConfig {
  id: string; // Unique instance ID (e.g., 'kpi-1', 'revenueChart-1')
  type: WidgetType;
  title: string; // User-customizable title
  position: { x: number; y: number }; // Grid position (0-based column index)
  size: { w: number; h: number }; // Grid size (columns × rows)
  config?: Record<string, any>; // Widget-specific configuration (future)
}

export interface WidgetMetadata {
  type: WidgetType;
  title: string; // Default title
  category: 'general' | 'charts' | 'rankings';
  icon?: RemixiconComponentType;
  defaultSize: { w: number; h: number }; // Default grid dimensions
  minSize?: { w: number; h: number }; // Minimum resize dimensions
  description?: string;
}

export interface WidgetProps {
  config: WidgetConfig;
  data: DashboardOverview; // Full dashboard data
  filters: DashboardFilters;
  settings: CompanySettings | null;
  isEditing: boolean;
}
```

### Widget Registry

```typescript
// src/features/lomustrack/dashboard/config/widget-registry.ts

export const WIDGET_REGISTRY: Record<WidgetType, WidgetMetadata> = {
  [WidgetType.KPI]: {
    type: WidgetType.KPI,
    title: 'Resumo (KPIs)',
    category: 'general',
    defaultSize: { w: 12, h: 2 }, // Full width, 2 rows
    minSize: { w: 6, h: 2 },
    description: 'Métricas principais do negócio',
  },
  [WidgetType.REVENUE_CHART]: {
    type: WidgetType.REVENUE_CHART,
    title: 'Faturamento Líquido',
    category: 'charts',
    defaultSize: { w: 6, h: 4 }, // Half width, 4 rows
    minSize: { w: 4, h: 3 },
    description: 'Evolução de faturamento, investimento e lucro',
  },
  [WidgetType.PAYMENT_METHOD_CHART]: {
    type: WidgetType.PAYMENT_METHOD_CHART,
    title: 'Meios de Pagamento',
    category: 'charts',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 3, h: 3 },
    description: 'Distribuição por método de pagamento',
  },
  [WidgetType.HOURLY_SALES_CHART]: {
    type: WidgetType.HOURLY_SALES_CHART,
    title: 'Vendas por Horário',
    category: 'charts',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 3, h: 3 },
    description: 'Horários de pico de vendas',
  },
  [WidgetType.SALES_BY_COUNTRY]: {
    type: WidgetType.SALES_BY_COUNTRY,
    title: 'Vendas por País',
    category: 'charts',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    description: 'Distribuição geográfica de vendas',
  },
  [WidgetType.TOP_CAMPAIGNS]: {
    type: WidgetType.TOP_CAMPAIGNS,
    title: 'Top Campanhas',
    category: 'rankings',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 3 },
    description: 'Campanhas com melhor desempenho',
  },
};
```

### Layout Storage Schema

**New LocalStorage Key**: `'dashboard-layout-v2'`

```json
{
  "version": 2,
  "widgets": [
    {
      "id": "kpi-1",
      "type": "kpi",
      "title": "Resumo (KPIs)",
      "position": { "x": 0, "y": 0 },
      "size": { "w": 12, "h": 2 }
    },
    {
      "id": "revenueChart-1",
      "type": "revenueChart",
      "title": "Faturamento Líquido",
      "position": { "x": 0, "y": 2 },
      "size": { "w": 6, "h": 4 }
    }
  ]
}
```

**Migration Strategy**: On first load, detect old format (`dashboard-config` with `activeCards`), convert to new format, and save to `dashboard-layout-v2`.

---

## Implementation Plan

The work decomposes into three logical features, each building on the previous:

### FEAT-001: Core Widget System Architecture

**Purpose**: Establish the foundational widget architecture with type definitions, registry, wrapper component, and enhanced state management.

**Deliverables**:
1. Widget type definitions (`types/widget.ts`)
2. Widget registry (`config/widget-registry.ts`)
3. Universal widget wrapper component (`components/WidgetWrapper.tsx`)
4. Enhanced dashboard layout hook (`hooks/useDashboardLayout.ts`)
5. Unit tests for widget registry

**Why This First**: FEAT-002 and FEAT-003 depend on these types and the widget system architecture. This establishes the data model and component structure.

**Files Created**:
- `src/features/lomustrack/dashboard/types/widget.ts`
- `src/features/lomustrack/dashboard/config/widget-registry.ts`
- `src/features/lomustrack/dashboard/components/WidgetWrapper.tsx`
- `src/features/lomustrack/dashboard/hooks/useDashboardLayout.ts`
- `src/features/lomustrack/dashboard/__tests__/widget-registry.test.ts`

**Files Modified**:
- `src/types/dashboard.ts` (export new types)

**Verification**:
```bash
npm test  # Run widget-registry tests
# Manually test useDashboardLayout hook in test file
# Render WidgetWrapper with each type and verify correct component loads
```

---

### FEAT-002: Grid Layout System and Drag-to-Canvas

**Purpose**: Integrate react-grid-layout for the 12-column grid, enable widget repositioning/resizing, and implement drag-from-sidebar-to-canvas functionality.

**Deliverables**:
1. DashboardGrid component with react-grid-layout integration
2. Enhanced DashboardEditor sidebar with drag-to-canvas support
3. Grid layout synchronization hook (`useGridLayout`)
4. Updated main dashboard page to use grid system
5. Custom CSS for grid styling matching LomusTrack design
6. Visual editing indicators in GlobalFilterBar

**Why This Second**: Builds on FEAT-001's widget system to enable the core drag-and-drop grid functionality. Users can now add, move, and resize widgets visually.

**Files Created**:
- `src/features/lomustrack/dashboard/components/DashboardGrid.tsx`
- `src/features/lomustrack/dashboard/hooks/useGridLayout.ts`
- `src/features/lomustrack/dashboard/styles/grid-overrides.css`

**Files Modified**:
- `src/features/lomustrack/dashboard/components/DashboardEditor.tsx` (add drag-to-canvas)
- `src/features/lomustrack/dashboard/index.tsx` (integrate grid system)
- `src/components/layout/GlobalFilterBar.tsx` (editing indicators)

**Verification**:
```bash
npm run dev
# Navigate to /dashboard
# Click edit button, drag widgets from sidebar onto grid
# Move and resize widgets
# Refresh page and verify layout persists
# Toggle edit mode and verify handles disappear
```

---

### FEAT-003: Widget Configuration and Editing Toolbar

**Purpose**: Complete the dashboard builder with widget configuration dialogs, editing toolbar (save/cancel/reset), widget action buttons, and responsive mobile adaptations.

**Deliverables**:
1. Dashboard editing toolbar with save/cancel/reset actions
2. Widget configuration dialog component
3. Widget action buttons (configure/remove) in widget headers
4. Mobile-responsive layout adaptations
5. Widget animations (fade-in, slide-out, smooth transitions)
6. Enhanced useDashboardLayout with save/cancel/dirty tracking

**Why This Last**: Adds the polish and usability features that complete the editing experience. Depends on FEAT-001's widget system and FEAT-002's grid layout being functional.

**Files Created**:
- `src/features/lomustrack/dashboard/components/DashboardToolbar.tsx`
- `src/features/lomustrack/dashboard/components/WidgetConfigDialog.tsx`
- `src/features/lomustrack/dashboard/components/DashboardMobileView.tsx`
- `src/features/lomustrack/dashboard/styles/widget-animations.css`

**Files Modified**:
- `src/features/lomustrack/dashboard/components/WidgetWrapper.tsx` (action buttons)
- `src/features/lomustrack/dashboard/index.tsx` (toolbar integration, save/cancel handlers)
- `src/features/lomustrack/dashboard/hooks/useDashboardLayout.ts` (save/cancel/isDirty)
- `src/components/layout/GlobalFilterBar.tsx` (editing badge, unsaved changes warning)

**Verification**:
```bash
npm run dev
# Test toolbar: save, cancel, reset to default
# Configure widget title via dialog
# Remove widgets with confirmation
# Verify mobile responsive layout (resize browser < 768px)
# Test on mobile device for touch interactions
npm test  # Ensure no regressions
```

---

## Technical Considerations

### Grid System Design

**12-Column Responsive Grid**:
- **Desktop (lg)**: 12 columns, 1200px+ width
- **Tablet (md)**: 12 columns, 996-1199px width
- **Small Tablet (sm)**: 6 columns, 768-995px width
- **Mobile (xs)**: 2 columns (or single column stack), <768px width

**Row Height**: 60px base unit with 10px gap between rows

**Default Widget Sizes**:
- KPIs: 12 columns × 2 rows (full width, compact)
- Large charts (Revenue, Sales by Country): 6 columns × 4 rows
- Medium charts (Payment, Hourly, Campaigns): 3 columns × 3 rows

### State Management Strategy

**Three-Layer State System**:

1. **LocalStorage** (`dashboard-layout-v2`): Persistent storage
2. **useDashboardLayout Hook**: Application state with CRUD operations
3. **useGridLayout Hook**: react-grid-layout synchronization

**State Flow**:
```
localStorage → useDashboardLayout → useGridLayout → DashboardGrid → WidgetWrapper
```

**Update Flow**:
```
User action → useGridLayout → useDashboardLayout → localStorage
```

### Migration Strategy

**Old Format** (`dashboard-config`):
```json
{
  "activeCards": ["kpis", "revenueChart", "paymentMethodChart", ...],
  "availableCards": []
}
```

**New Format** (`dashboard-layout-v2`):
```json
{
  "version": 2,
  "widgets": [
    { "id": "kpi-1", "type": "kpi", "title": "...", "position": {...}, "size": {...} }
  ]
}
```

**Migration Logic** (in `useDashboardLayout`):
1. Check if `dashboard-layout-v2` exists → use it
2. Else check if `dashboard-config` exists → migrate to v2 format
3. Else use default layout from `WIDGET_REGISTRY`

**Default Layout Positions**:
- KPI: (0, 0, 12, 2)
- Revenue Chart: (0, 2, 6, 4)
- Payment Methods: (6, 2, 3, 3)
- Top Campaigns: (9, 2, 3, 3)
- Hourly Sales: (6, 5, 3, 3)
- Sales by Country: (0, 6, 6, 4)

### Drag-and-Drop Integration

**Two Drag Contexts**:

1. **Sidebar Reordering** (existing): Uses `@dnd-kit/sortable` for reordering active widgets in sidebar list
2. **Sidebar-to-Canvas** (new): Uses `@dnd-kit/core` useDraggable for dragging widget templates from sidebar onto grid

**Drop Handling**:
- Detect drop position on grid
- Find first available empty space if dropped position has collision
- Generate unique widget ID: `${type}-${timestamp}`
- Create WidgetConfig with metadata from WIDGET_REGISTRY
- Add to widgets array via `addWidget(config)`

### Component Data Flow

**WidgetWrapper Props Mapping**:

```typescript
// WidgetWrapper receives full data and filters which pass to child components:

<WidgetWrapper config={widgetConfig} data={dashboardData} filters={filters} settings={settings} isEditing={isEditing}>
  {/* Internally routes to: */}
  
  {config.type === 'kpi' && (
    <KpiGrid
      kpis={data.kpis}
      taxEnabled={filters.taxEnabled}
      taxRate={settings?.tax_rate ?? 0}
      opCostsEnabled={filters.opCostsEnabled}
      opCostsTotal={settings?.operational_costs.reduce((s, c) => s + c.amount, 0) ?? 0}
    />
  )}
  
  {config.type === 'revenueChart' && (
    <RevenueChart data={data.daily_revenue} />
  )}
  
  {config.type === 'hourlySalesChart' && (
    <HourlySalesChart data={data.hourly_sales} />
  )}
  
  {/* ... etc for other types */}
</WidgetWrapper>
```

### Mobile Responsiveness

**Breakpoint Strategy**:
- **Desktop (≥1200px)**: Full grid layout with sidebar drawer, drag & resize enabled
- **Tablet (768-1199px)**: Responsive grid (6-12 columns), sidebar drawer, limited resize
- **Mobile (<768px)**: Single-column stack OR 2-column simple grid, bottom sheet sidebar, drag/resize disabled

**Mobile-Specific Changes**:
- Sidebar becomes bottom Sheet (drawer from bottom)
- DashboardGrid switches to static vertical layout
- Larger tap targets for buttons (min 44×44px)
- Simplified toolbar with icon-only buttons
- Touch-friendly gestures

### CSS Customization

**React-Grid-Layout Overrides** (`grid-overrides.css`):
```css
.react-grid-layout {
  background: transparent;
}

.react-grid-item {
  transition: all 200ms ease;
  transition-property: transform, width, height;
}

.react-grid-item.react-grid-placeholder {
  background: hsl(var(--primary) / 0.1);
  border: 2px dashed hsl(var(--primary) / 0.4);
  border-radius: 0.75rem;
  opacity: 0.6;
  transition: all 100ms;
}

.react-grid-item > .react-resizable-handle {
  background-image: none;
  /* Custom corner handle with Remix icon */
}

.react-grid-item.react-draggable-dragging {
  opacity: 0.8;
  z-index: 100;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}
```

### Performance Considerations

**Optimization Strategies**:
1. **Lazy Load Charts**: Existing components already lazy-loaded
2. **Debounce Layout Changes**: Debounce localStorage writes on drag (300ms)
3. **Memoize Widget Components**: Use React.memo for WidgetWrapper children
4. **Virtualization**: Not needed for <20 widgets typical use case
5. **Throttle Resize Events**: Throttle react-grid-layout resize callbacks

**Data Fetching**:
- Dashboard data already cached by `useCachedQuery` hook
- No per-widget data fetching — all widgets share same `DashboardOverview` data
- Filters trigger full dashboard reload (existing behavior preserved)

---

## Testing Strategy

### Unit Tests

**Widget Registry** (`__tests__/widget-registry.test.ts`):
```typescript
describe('WIDGET_REGISTRY', () => {
  it('should contain all 6 widget types', () => {
    expect(Object.keys(WIDGET_REGISTRY)).toHaveLength(6);
  });
  
  it('should have valid metadata for each widget', () => {
    Object.values(WIDGET_REGISTRY).forEach(widget => {
      expect(widget.title).toBeTruthy();
      expect(widget.category).toMatch(/^(general|charts|rankings)$/);
      expect(widget.defaultSize.w).toBeGreaterThan(0);
      expect(widget.defaultSize.h).toBeGreaterThan(0);
    });
  });
});
```

**Hook Tests** (integration tests for useDashboardLayout):
- Test initial load from localStorage
- Test migration from old format
- Test add/remove/update widget operations
- Test reset to default
- Test save/cancel/isDirty state

### Integration Tests

**Dashboard Page**:
1. Load dashboard with no saved layout → verify default layout loads
2. Enter edit mode → verify sidebar opens and toolbar appears
3. Drag widget from sidebar → verify widget added to grid
4. Move and resize widget → verify position updates
5. Save layout → verify persists to localStorage
6. Refresh page → verify layout restores correctly
7. Reset to default → verify default layout restores

### Manual Testing Checklist

- [ ] Dashboard loads with default 6 widgets
- [ ] Edit button opens sidebar and shows toolbar
- [ ] Can drag KPI widget from sidebar onto grid
- [ ] Can drag Revenue Chart from sidebar onto grid
- [ ] Can reposition widgets by dragging headers
- [ ] Can resize widgets by corner handles
- [ ] Widget snaps to grid correctly
- [ ] No collision/overlap between widgets
- [ ] Save button persists layout
- [ ] Cancel button discards changes
- [ ] Reset button restores default (after confirmation)
- [ ] Configure button opens dialog with title editor
- [ ] Remove button deletes widget (after confirmation)
- [ ] Layout persists across page reloads
- [ ] Mobile responsive: sidebar becomes bottom sheet
- [ ] Mobile responsive: grid becomes single column
- [ ] Touch interactions work on mobile device
- [ ] Animations smooth (fade-in, slide-out)
- [ ] No console errors or warnings
- [ ] Existing dashboard filters still work
- [ ] Existing dashboard data loading still works

---

## Digest

### Files to Create

| File Path | Purpose | Lines (Est.) |
|-----------|---------|--------------|
| `src/features/lomustrack/dashboard/types/widget.ts` | Widget type definitions | 50 |
| `src/features/lomustrack/dashboard/config/widget-registry.ts` | Widget metadata registry | 80 |
| `src/features/lomustrack/dashboard/components/WidgetWrapper.tsx` | Universal widget container | 150 |
| `src/features/lomustrack/dashboard/hooks/useDashboardLayout.ts` | Layout state management hook | 200 |
| `src/features/lomustrack/dashboard/__tests__/widget-registry.test.ts` | Widget registry unit tests | 60 |
| `src/features/lomustrack/dashboard/components/DashboardGrid.tsx` | react-grid-layout wrapper | 180 |
| `src/features/lomustrack/dashboard/hooks/useGridLayout.ts` | Grid synchronization hook | 120 |
| `src/features/lomustrack/dashboard/styles/grid-overrides.css` | Custom grid styles | 100 |
| `src/features/lomustrack/dashboard/components/DashboardToolbar.tsx` | Editing toolbar component | 120 |
| `src/features/lomustrack/dashboard/components/WidgetConfigDialog.tsx` | Widget config dialog | 100 |
| `src/features/lomustrack/dashboard/components/DashboardMobileView.tsx` | Mobile responsive layout | 80 |
| `src/features/lomustrack/dashboard/styles/widget-animations.css` | Widget animations | 80 |

### Files to Modify

| File Path | Changes | Lines (Est.) |
|-----------|---------|--------------|
| `src/types/dashboard.ts` | Export new widget types (1 export line) | +5 |
| `src/features/lomustrack/dashboard/components/DashboardEditor.tsx` | Add drag-to-canvas with useDraggable | +80 |
| `src/features/lomustrack/dashboard/index.tsx` | Replace activeCards rendering with DashboardGrid, integrate hooks, toolbar | +150 |
| `src/components/layout/GlobalFilterBar.tsx` | Add isEditing prop, editing badge, unsaved changes warning | +40 |

### Verification Commands

**Build**: `npm run build` (Vite build)
**Dev Server**: `npm run dev` (Vite dev server on default port)
**Tests**: `npm test` (Vitest run)
**Lint**: `npm run lint` (ESLint)

**Key Test Files**:
- `src/features/lomustrack/dashboard/__tests__/widget-registry.test.ts` (new)
- Existing tests should still pass (no breaking changes)

### Dependencies

All required dependencies already installed in package.json:
- `react-grid-layout` ^2.3.0
- `@types/react-grid-layout` (devDependencies)
- `@dnd-kit/core` ^6.3.1
- `@dnd-kit/sortable` ^10.0.0
- `@dnd-kit/utilities` ^3.2.2
- `framer-motion` ^14.14.0
- `recharts` ^2.15.4

**No `npm install` required** unless dependencies are missing.

### Existing Components to Reuse

- `KpiGrid`, `KpiCard` — KPI widget content
- `RevenueChart` — Revenue chart widget content
- `HourlySalesChart` — Hourly sales widget content
- `PaymentMethodChart` — Payment methods widget content
- `TopCampaigns` — Top campaigns widget content
- `SalesByCountryCard` — Sales by country widget content
- `Card`, `CardHeader`, `CardContent` — Base card styling
- `Sheet` — Sidebar drawer
- `Button`, `Dialog`, `AlertDialog` — UI controls
- `Collapsible` — Accordion categories in sidebar

### Data Flow Summary

```
API (/dashboard/overview)
  ↓
useDashboard() hook
  ↓
DashboardOverview data
  ↓
DashboardGrid (with widgets array from useDashboardLayout)
  ↓
WidgetWrapper (for each widget)
  ↓
Specific widget component (KpiGrid, RevenueChart, etc.)
```

### localStorage Schema

**Key**: `dashboard-layout-v2`

**Value**:
```json
{
  "version": 2,
  "widgets": [
    {
      "id": "string",
      "type": "kpi | revenueChart | paymentMethodChart | hourlySalesChart | salesByCountry | topCampaigns",
      "title": "string",
      "position": { "x": 0, "y": 0 },
      "size": { "w": 12, "h": 2 },
      "config": {}
    }
  ]
}
```

---

## Implementation Order Rationale

1. **FEAT-001 (Core Widget System)**: Establishes the data model and component architecture that FEAT-002 and FEAT-003 build upon. No visual changes yet, but creates the foundation.

2. **FEAT-002 (Grid Layout System)**: Adds the core drag-and-drop functionality users will interact with. Depends on FEAT-001's widget types and registry. This is the high-value feature that enables customization.

3. **FEAT-003 (Configuration & Toolbar)**: Adds the polish, editing controls, and mobile responsiveness that complete the experience. Depends on FEAT-002's grid system being functional.

This sequence ensures each feature leaves the codebase in a buildable, testable state, with no "stub" features that await future implementation.

---

## Risk Mitigation

**Potential Risks**:

1. **Breaking Existing Dashboard**: Mitigation: Preserve all existing components, data flow, and API calls. Use feature flag or gradual rollout.

2. **LocalStorage Migration Issues**: Mitigation: Robust migration logic with fallback to default layout. Keep old key intact (don't delete `dashboard-config`).

3. **Mobile Layout Complexity**: Mitigation: Detect screen size early and render different component tree for mobile rather than trying to adapt grid layout.

4. **Performance with Many Widgets**: Mitigation: Memoize components, debounce localStorage writes, limit max widgets (e.g., 15-20).

5. **State Synchronization Bugs**: Mitigation: Single source of truth (useDashboardLayout), clear data flow, comprehensive testing of add/remove/update operations.

---

## Conclusion

This implementation plan provides a complete, production-ready path to building the LomusTrack Dashboard Builder. The plan is grounded in the existing codebase, reuses established patterns and components, requires no new dependencies, and decomposes the work into three logical, independently verifiable features. Each feature builds on the previous, ensuring steady progress toward the complete drag-and-drop customizable dashboard system.
