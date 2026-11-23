import { useState, useEffect, useRef } from "react";
import {
  RiCalendarLine,
  RiFilterLine,
  RiCloseLine,
  RiPencilLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DashboardFilters, DatePreset } from "@/hooks/use-dashboard";
import type { CompanySettings } from "@/types/company";
import type { UpsellOption } from "@/types/sale";
import { ProductSelect } from "@/components/ProductSelect";

const presetLabels: Record<DatePreset, string> = {
  today: "Hoje",
  "7d": "Últimos 7 dias",
  "14d": "Últimos 14 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  all: "Tempo inteiro",
  custom: "Personalizado",
};

interface GlobalFilterBarProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  settings: CompanySettings | null;
  products: { id: number; name: string }[];
  upsells?: UpsellOption[];
  platforms?: { value: string; label: string }[];
  accounts?: { slug: string; name: string; platform: string }[];
  onEditClick?: () => void;
  showEditButton?: boolean;
}

export function GlobalFilterBar({
  filters,
  onFiltersChange,
  settings,
  products,
  upsells = [],
  platforms = [],
  accounts = [],
  onEditClick,
  showEditButton = false,
}: GlobalFilterBarProps) {
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setIsSticky(!entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
  const isCustom = filters.datePreset === "custom";
  const activeCount = [
    filters.datePreset !== "today" ? "1" : "",
    filters.product !== "all" ? "1" : "",
    filters.platform !== "all" ? "1" : "",
    filters.accountSlug !== "all" ? "1" : "",
  ].filter(Boolean).length;
  const platformLabels: Record<string, string> = {
    kiwify: "Kiwify",
    payt: "PayT",
    hotmart: "Hotmart",
    api: "API",
  };
  const handleClear = () =>
    onFiltersChange({
      datePreset: "today",
      dateStart: "",
      dateEnd: "",
      product: "all",
      platform: "all",
      accountSlug: "all",
      taxEnabled: false,
      opCostsEnabled: false,
    });

  return (
    <>
      <div ref={sentinelRef} className="h-0 w-full" />
      <div
        className={`flex flex-wrap items-center gap-2.5 p-3 rounded-xl border transition-all duration-300 mobile-filter-scroll ${isSticky ? "sticky top-0 z-30 bg-card/95 backdrop-blur-md shadow-lg border-border/60" : "bg-card/50 border-border/30"}`}
      >
        <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
          <RiFilterLine className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Filtros</span>
          {activeCount > 0 && (
            <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </div>
        {/* Date Preset */}
        <div className="flex items-center gap-1.5">
          <RiCalendarLine className="size-3.5 text-muted-foreground" />
          <Select
            value={filters.datePreset}
            onValueChange={(v) => onFiltersChange({ ...filters, datePreset: v as DatePreset })}
          >
            <SelectTrigger className="h-9 w-[170px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(presetLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isCustom && (
          <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
            <Input
              type="date"
              value={filters.dateStart}
              onChange={(e) => onFiltersChange({ ...filters, dateStart: e.target.value })}
              className="h-9 w-[150px] text-xs"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <Input
              type="date"
              value={filters.dateEnd}
              onChange={(e) => onFiltersChange({ ...filters, dateEnd: e.target.value })}
              className="h-9 w-[150px] text-xs"
            />
          </div>
        )}
        <ProductSelect
          value={filters.product}
          onValueChange={(v) => onFiltersChange({ ...filters, product: v })}
          products={products}
          upsells={upsells}
          className="h-9 w-[170px] text-xs"
        />

        <Select
          value={filters.platform}
          onValueChange={(v) => onFiltersChange({ ...filters, platform: v })}
        >
          <SelectTrigger className="h-9 w-[140px] text-xs">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {platforms.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.accountSlug}
          onValueChange={(v) => onFiltersChange({ ...filters, accountSlug: v })}
        >
          <SelectTrigger className="h-9 w-[170px] text-xs">
            <SelectValue placeholder="Conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Contas</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.slug} value={a.slug}>
                {a.name} ({platformLabels[a.platform] || a.platform})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RiCloseLine className="size-3.5" />
            Limpar
          </Button>
        )}
        
        {showEditButton && onEditClick && (
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEditClick}
              className="h-9 w-9 hover:bg-transparent hover:text-primary"
              title="Editar Dashboard"
            >
              <RiPencilLine className="size-5" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
