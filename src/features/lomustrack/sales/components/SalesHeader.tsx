import { useState, useEffect } from "react";
import { RiLineChartLine, RiSearchLine, RiFilterLine } from "@remixicon/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DateRangeFilter, type DateRangeState } from "@/components/DateRangeFilter";

interface SalesHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onToggleFilters: () => void;
  filtersOpen: boolean;
  dateRange: DateRangeState;
  onDateRangeChange: (value: DateRangeState) => void;
}

export function SalesHeader({
  search,
  onSearchChange,
  onToggleFilters,
  filtersOpen,
  dateRange,
  onDateRangeChange,
}: SalesHeaderProps) {
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <RiLineChartLine className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Vendas</h1>
          <p className="text-sm text-muted-foreground">Transações realizadas</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <DateRangeFilter value={dateRange} onChange={onDateRangeChange} />
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar email, pedido ou produto..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 w-full sm:w-[240px] h-9 text-sm"
          />
        </div>
        <Button
          variant={filtersOpen ? "default" : "outline"}
          onClick={onToggleFilters}
          className={cn("gap-1.5 h-9", filtersOpen && "shadow-sm")}
        >
          <RiFilterLine className="size-4" />
          Filtros
        </Button>
      </div>
    </div>
  );
}
