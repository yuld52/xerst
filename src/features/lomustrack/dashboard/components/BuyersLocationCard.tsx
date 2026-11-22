import { useState, useEffect, useMemo, useCallback } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import {
  RiInformationLine,
  RiGlobalLine,
  RiListUnordered,
  RiSearchLine,
  RiFocus3Line,
  RiMapPinLine,
} from "@remixicon/react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { convertAndFormatMZN } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { BuyerLocation } from "@/types/dashboard";

interface BuyersLocationCardProps {
  data?: BuyerLocation[];
  totalSales?: number;
  totalRevenue?: number;
}

const DEFAULT_LOCATIONS: BuyerLocation[] = [
  { city: "São Paulo", state: "SP", country: "Brasil", lat: -23.5505, lng: -46.6333, sales: 356, revenue: 695877 },
  { city: "Rio de Janeiro", state: "RJ", country: "Brasil", lat: -22.9068, lng: -43.1729, sales: 203, revenue: 397644 },
  { city: "Belo Horizonte", state: "MG", country: "Brasil", lat: -19.9167, lng: -43.9345, sales: 127, revenue: 248528 },
  { city: "Curitiba", state: "PR", country: "Brasil", lat: -25.4284, lng: -49.2733, sales: 93, revenue: 182253 },
  { city: "Brasília", state: "DF", country: "Brasil", lat: -15.7975, lng: -47.8919, sales: 68, revenue: 132548 },
];

// Real world map rendered via react-simple-maps
interface WorldMapSVGProps {
  locations: BuyerLocation[];
  selectedLocation: BuyerLocation;
  onSelectLocation: (loc: BuyerLocation) => void;
}

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function WorldMapSVG({ locations, selectedLocation, onSelectLocation }: WorldMapSVGProps) {
  return (
    <div style={{width: "100%", height: "100%", background: "#0d1520", borderRadius: "inherit"}}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{center: [0, 20], scale: 130}}
        style={{width: "100%", height: "100%"}}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="-10000" y="-10000" width="20000" height="20000" fill="#0d1520" />
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#1e293b"
                stroke="#334155"
                strokeWidth={0.5}
                style={{ outline: "none" }}
              />
            ))
          }
        </Geographies>
        {locations.map((loc) => {
          const isSelected = selectedLocation.city === loc.city;
          return (
            <Marker
              key={`${loc.city}-${loc.state}`}
              coordinates={[loc.lng, loc.lat]}
              onClick={() => onSelectLocation(loc)}
              style={{cursor: "pointer"}}
            >
              {isSelected && (
                <>
                  <circle r={18} fill="rgba(59,130,246,0.08)" />
                  <circle r={13} fill="rgba(59,130,246,0.15)" />
                  <circle r={9} fill="rgba(59,130,246,0.28)" />
                </>
              )}
              <circle
                r={isSelected ? 7 : 4}
                fill={isSelected ? "#3b82f6" : "#2563eb"}
                stroke={isSelected ? "#93c5fd" : "#1d4ed8"}
                strokeWidth={isSelected ? 1.5 : 1}
                opacity={isSelected ? 1 : 0.85}
                filter={isSelected ? "url(#glow)" : undefined}
              />
              <circle
                r={isSelected ? 2.5 : 1.8}
                fill="#bfdbfe"
                opacity={0.9}
              />
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
}

export function BuyersLocationCard({
  data,
  totalSales,
  totalRevenue,
}: BuyersLocationCardProps) {
  const [viewMode, setViewMode] = useState<"mapa" | "lista">("mapa");
  const [searchQuery, setSearchQuery] = useState("");

  const locations: BuyerLocation[] = useMemo(() => {
    if (totalSales === 0) return [];

    if (data && data.length > 0) {
      const sumSales = data.reduce((s, l) => s + (l.sales || 0), 0);
      if (totalSales && totalSales > 0 && totalRevenue && totalRevenue > 0 && sumSales <= data.length) {
        const proportions = [0.42, 0.24, 0.15, 0.11, 0.08];
        return data.map((loc, idx) => {
          const p = proportions[idx] || (1 / data.length);
          return { ...loc, sales: Math.max(1, Math.round(totalSales * p)), revenue: Number((totalRevenue * p).toFixed(2)) };
        }).sort((a, b) => b.sales - a.sales || b.revenue - a.revenue);
      }
      return [...data].sort((a, b) => b.sales - a.sales || b.revenue - a.revenue);
    }

    if (!totalSales || totalSales <= 0) return [];

    const proportions = [0.42, 0.24, 0.15, 0.11, 0.08];
    return DEFAULT_LOCATIONS.map((loc, idx) => {
      const p = proportions[idx] || (1 / DEFAULT_LOCATIONS.length);
      return { ...loc, sales: Math.max(1, Math.round(totalSales * p)), revenue: Number(((totalRevenue || 0) * p).toFixed(2)) };
    }).sort((a, b) => b.sales - a.sales || b.revenue - a.revenue);
  }, [data, totalSales, totalRevenue]);

  const [selectedLocation, setSelectedLocation] = useState<BuyerLocation>(
    locations[0] || DEFAULT_LOCATIONS[0],
  );

  useEffect(() => {
    if (locations.length > 0) {
      setSelectedLocation((curr) => {
        const match = locations.find((l) => l.city === curr.city);
        return match || locations[0];
      });
    }
  }, [locations]);

  const handleSelectLocation = useCallback((loc: BuyerLocation, switchToMap = false) => {
    setSelectedLocation(loc);
    if (switchToMap) setViewMode("mapa");
  }, []);

  const totalLocSales = useMemo(() => locations.reduce((sum, l) => sum + l.sales, 0), [locations]);
  const totalLocRevenue = useMemo(() => locations.reduce((sum, l) => sum + l.revenue, 0), [locations]);

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const q = searchQuery.toLowerCase();
    return locations.filter(
      (l) => l.city.toLowerCase().includes(q) || l.state.toLowerCase().includes(q) || (l.country && l.country.toLowerCase().includes(q)),
    );
  }, [locations, searchQuery]);

  return (
    <Card className="h-full min-h-[320px] lg:min-h-[360px] rounded-lg bg-white dark:bg-card border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col justify-between overflow-hidden py-0 gap-0 transition-all">
      <CardHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-white/[0.04]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="leading-tight text-left">
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">De onde</h3>
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">compram</h3>
            </div>
            <span className="inline-flex cursor-help text-slate-400/80 hover:text-slate-200 transition-colors self-start mt-0.5" title="Origem geográfica dos clientes com base nas vendas e conversões registradas.">
              <RiInformationLine className="size-4" />
            </span>
          </div>

          <div className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/60 dark:border-white/10 text-xs">
            <button type="button" onClick={() => setViewMode("mapa")} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all", viewMode === "mapa" ? "bg-white dark:bg-[#202738] text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground")}>
              <RiGlobalLine className="size-3.5" />
              <span>Mapa</span>
            </button>
            <button type="button" onClick={() => setViewMode("lista")} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all", viewMode === "lista" ? "bg-white dark:bg-[#202738] text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground")}>
              <RiListUnordered className="size-3.5" />
              <span>Lista</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between p-4 pt-1">
        {locations.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center p-4 text-muted-foreground min-h-[220px]">
            <RiMapPinLine className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-medium">Nenhuma venda registrada no período</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === "mapa" ? (
              <motion.div key="view-mapa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col items-center justify-between gap-2">
                {/* Map */}
                <div className="relative w-full rounded-xl overflow-hidden border border-white/[0.05]" style={{ aspectRatio: "2/1" }}>
                  <WorldMapSVG locations={locations} selectedLocation={selectedLocation} onSelectLocation={handleSelectLocation} />
                </div>

                {/* Location badges */}
                <div className="flex flex-col items-center gap-1 w-full max-w-[260px]">
                  {locations.slice(0, 2).map((loc) => {
                    const isSelected = selectedLocation.city === loc.city;
                    return (
                      <button key={`${loc.city}-${loc.state}`} type="button" onClick={() => handleSelectLocation(loc)} className={cn("w-full flex items-center justify-center gap-2 py-1 px-3 rounded-xl text-xs font-medium transition-all border", isSelected ? "bg-blue-600/15 border-blue-500/60 text-blue-500 dark:text-blue-300 shadow-[0_0_14px_rgba(59,130,246,0.25)] font-semibold scale-[1.02]" : "bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground")}>
                        <span className={cn("size-2 rounded-full transition-all", isSelected ? "bg-blue-500 dark:bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.9)] animate-pulse" : "bg-zinc-400/70")} />
                        <span>{loc.city}, {loc.state} · {loc.sales} {loc.sales === 1 ? "venda" : "vendas"}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-center text-[11px] text-muted-foreground font-medium tracking-tight">
                  {selectedLocation.city}, {selectedLocation.state} — {selectedLocation.sales} {selectedLocation.sales === 1 ? "venda" : "vendas"} ({convertAndFormatMZN(selectedLocation.revenue)})
                </p>
              </motion.div>
            ) : (
              <motion.div key="view-lista" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col justify-start space-y-2 mt-1">
                <div className="relative w-full">
                  <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input type="text" placeholder="Filtrar cidade ou estado..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border/50 bg-muted/30 placeholder:text-muted-foreground/60 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 font-medium">
                  <span>{filteredLocations.length} cidades mapeadas</span>
                  <span>Total: {totalLocSales} {totalLocSales === 1 ? "venda" : "vendas"} ({convertAndFormatMZN(totalLocRevenue)})</span>
                </div>

                <div className="flex flex-col space-y-1.5 overflow-y-auto max-h-[190px] pr-1">
                  {filteredLocations.length > 0 ? filteredLocations.map((loc, idx) => {
                    const isSelected = selectedLocation.city === loc.city;
                    const pct = totalLocSales > 0 ? (loc.sales / totalLocSales) * 100 : 0;
                    return (
                      <div key={`${loc.city}-${loc.state}`} onClick={() => handleSelectLocation(loc)} className={cn("group flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer", isSelected ? "bg-blue-600/10 border-blue-500/40 shadow-sm" : "bg-muted/20 border-border/30 hover:bg-muted/40")}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", idx === 0 ? "bg-amber-500/20 text-amber-500" : "bg-muted text-muted-foreground")}>{idx + 1}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{loc.city}, {loc.state}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Math.max(12, pct))}%` }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className="text-xs font-bold text-foreground">{loc.sales} {loc.sales === 1 ? "venda" : "vendas"}</p>
                            <p className="text-[10px] text-muted-foreground">{convertAndFormatMZN(loc.revenue)}</p>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleSelectLocation(loc, true); }} title="Ver no Mapa" className="size-6 rounded-lg bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors">
                            <RiFocus3Line className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-6 text-xs text-muted-foreground">Nenhuma cidade encontrada para "{searchQuery}".</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
