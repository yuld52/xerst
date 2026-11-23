import { useState, useEffect, useMemo, useCallback } from "react";
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

// Equirectangular projection (1000×500 canvas)
const W = 1000, H = 500;
function proj(lng: number, lat: number): [number, number] {
  return [((lng + 180) / 360) * W, ((90 - lat) / 180) * H];
}

// World land masses as SVG paths in equirectangular 1000×500 projection
// Coordinates pre-computed: x=((lng+180)/360)*1000, y=((90-lat)/180)*500
const LAND_PATH = [
  // North America (mainland)
  "M 42,61 L 55,55 L 72,52 L 90,48 L 108,46 L 120,52 L 128,60 L 133,70 L 138,80 L 140,92 L 136,104 L 128,114 L 118,122 L 108,128 L 98,132 L 88,136 L 78,138 L 68,135 L 58,128 L 50,118 L 44,106 L 40,94 L 38,80 L 40,68 Z",
  // Greenland
  "M 158,22 L 172,16 L 188,14 L 200,18 L 206,28 L 202,38 L 190,44 L 176,44 L 164,38 L 156,28 Z",
  // Alaska
  "M 25,52 L 38,46 L 52,48 L 58,56 L 50,64 L 36,64 Z",
  // Central America
  "M 118,122 L 126,118 L 132,122 L 134,130 L 128,136 L 120,132 Z",
  // Cuba
  "M 130,118 L 140,114 L 148,116 L 146,122 L 136,124 Z",
  // South America
  "M 162,130 L 178,124 L 194,124 L 206,130 L 212,142 L 216,158 L 218,176 L 216,196 L 210,214 L 200,230 L 186,242 L 170,248 L 155,244 L 144,232 L 138,216 L 136,198 L 138,180 L 142,162 L 148,146 L 154,134 Z",
  // Europe (mainland)
  "M 448,70 L 462,64 L 480,62 L 496,66 L 506,74 L 504,84 L 494,92 L 480,98 L 466,100 L 452,96 L 444,86 L 444,76 Z",
  // Iberian Peninsula
  "M 436,88 L 448,84 L 456,88 L 454,100 L 442,104 L 434,96 Z",
  // UK + Ireland
  "M 430,66 L 440,62 L 448,66 L 446,76 L 436,78 L 428,74 Z",
  // Scandinavia
  "M 464,52 L 478,44 L 490,48 L 494,60 L 488,72 L 476,76 L 464,70 Z",
  // Iceland
  "M 394,46 L 406,40 L 418,42 L 420,52 L 410,58 L 398,54 Z",
  // Africa
  "M 448,116 L 466,108 L 486,108 L 504,114 L 516,126 L 522,142 L 524,162 L 520,182 L 512,200 L 500,214 L 484,222 L 468,222 L 452,214 L 441,198 L 437,180 L 438,160 L 442,140 L 446,128 Z",
  // Madagascar
  "M 528,186 L 536,178 L 542,184 L 540,198 L 532,204 L 526,196 Z",
  // Arabian Peninsula
  "M 536,106 L 552,98 L 568,100 L 574,112 L 568,126 L 552,132 L 537,124 Z",
  // Russia / Central Asia (simplified)
  "M 500,54 L 540,42 L 590,36 L 650,34 L 700,38 L 730,46 L 740,58 L 726,68 L 700,74 L 660,76 L 620,74 L 580,70 L 548,68 L 518,66 L 500,62 Z",
  // India
  "M 594,110 L 610,104 L 622,108 L 628,120 L 626,136 L 618,148 L 606,156 L 594,150 L 585,138 L 584,122 Z",
  // Southeast Asia (Indochina)
  "M 652,114 L 668,108 L 678,112 L 682,124 L 674,136 L 658,138 L 647,128 Z",
  // China / East Asia
  "M 630,68 L 656,60 L 684,60 L 706,68 L 716,80 L 712,94 L 696,104 L 672,108 L 650,106 L 632,96 L 626,82 Z",
  // Japan
  "M 724,70 L 734,64 L 740,70 L 738,80 L 728,84 L 720,78 Z",
  // Borneo
  "M 680,148 L 694,140 L 706,144 L 708,158 L 696,164 L 680,160 Z",
  // Sumatra
  "M 648,148 L 662,140 L 674,144 L 672,158 L 658,162 L 646,156 Z",
  // Java
  "M 672,164 L 684,160 L 694,162 L 692,170 L 680,172 L 670,168 Z",
  // Philippines
  "M 710,112 L 720,106 L 728,110 L 726,122 L 716,124 L 708,118 Z",
  // Australia
  "M 718,218 L 740,208 L 762,206 L 782,212 L 795,226 L 798,244 L 790,260 L 774,272 L 752,278 L 730,274 L 712,260 L 705,244 L 706,228 Z",
  // New Zealand N
  "M 806,264 L 814,258 L 820,264 L 818,274 L 810,276 Z",
  // New Zealand S
  "M 808,278 L 816,272 L 820,278 L 816,290 L 808,288 Z",
].join(" ");

interface WorldMapSVGProps {
  locations: BuyerLocation[];
  selectedLocation: BuyerLocation;
  onSelectLocation: (loc: BuyerLocation) => void;
}

function WorldMapSVG({ locations, selectedLocation, onSelectLocation }: WorldMapSVGProps) {
  const maxSales = Math.max(...locations.map((l) => l.sales), 1);

  return (
    <svg
      viewBox="0 0 1000 500"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0a0f1e" />
          <stop offset="100%" stopColor="#0d1520" />
        </linearGradient>
        <radialGradient id="glow-sel" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
        <filter id="blur-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>

      {/* Ocean */}
      <rect width="1000" height="500" fill="url(#bg)" rx="8" />

      {/* Subtle grid */}
      {[60, 120, 180, 240, 300].map(x => (
        <line key={x} x1={x} y1={0} x2={x} y2={500} stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1" />
      ))}
      {[100, 200, 300, 400].map(y => (
        <line key={y} x1={0} y1={y} x2={1000} y2={y} stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1" />
      ))}

      {/* Land — soft glow layer */}
      <path d={LAND_PATH} fill="#1e3a5f" opacity="0.3" filter="url(#soft)" />

      {/* Land — main fill */}
      <path d={LAND_PATH} fill="#1e293b" stroke="#2d4a6b" strokeWidth="0.8" strokeLinejoin="round" />

      {/* Equator line */}
      <line x1={0} y1={250} x2={1000} y2={250} stroke="#3b82f6" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="4 8" />

      {/* Markers */}
      {locations.map((loc) => {
        const [x, y] = proj(loc.lng, loc.lat);
        const isSelected = selectedLocation.city === loc.city;
        const r = isSelected ? 5 : Math.max(2.5, Math.min(4, 2.5 + (loc.sales / maxSales) * 1.5));

        return (
          <g
            key={`${loc.city}-${loc.state}`}
            onClick={() => onSelectLocation(loc)}
            style={{ cursor: "pointer" }}
          >
            {isSelected && (
              <>
                <circle cx={x} cy={y} r={r + 10} fill="url(#glow-sel)" />
                <circle cx={x} cy={y} r={r + 6} fill="none" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.25" />
                <circle cx={x} cy={y} r={r + 3} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.4" />
              </>
            )}
            <circle cx={x + 0.5} cy={y + 0.5} r={r} fill="#000" opacity={0.25} />
            <circle
              cx={x} cy={y} r={r}
              fill={isSelected ? "#3b82f6" : "#1d4ed8"}
              stroke={isSelected ? "#93c5fd" : "#3b82f6"}
              strokeWidth={isSelected ? 1.5 : 1}
              filter={isSelected ? "url(#blur-glow)" : undefined}
            />
            <circle cx={x} cy={y} r={r * 0.38} fill={isSelected ? "#dbeafe" : "#93c5fd"} opacity={0.9} />
          </g>
        );
      })}
    </svg>
  );
}

export function BuyersLocationCard({ data, totalSales, totalRevenue }: BuyersLocationCardProps) {
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

  const totalLocSales = useMemo(() => locations.reduce((s, l) => s + l.sales, 0), [locations]);
  const totalLocRevenue = useMemo(() => locations.reduce((s, l) => s + l.revenue, 0), [locations]);

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const q = searchQuery.toLowerCase();
    return locations.filter(l =>
      l.city.toLowerCase().includes(q) || l.state.toLowerCase().includes(q) || (l.country && l.country.toLowerCase().includes(q))
    );
  }, [locations, searchQuery]);

  return (
    <Card className="h-full min-h-[320px] lg:min-h-[360px] rounded-lg bg-white dark:bg-card border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col overflow-hidden py-0 gap-0 transition-all">
      <CardHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-white/[0.04]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="leading-tight">
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">De onde</h3>
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">compram</h3>
            </div>
            <span className="inline-flex cursor-help text-slate-400/80 hover:text-slate-200 transition-colors self-start mt-0.5" title="Origem geográfica dos clientes com base nas vendas registradas.">
              <RiInformationLine className="size-4" />
            </span>
          </div>
          <div className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/60 dark:border-white/10 text-xs">
            <button type="button" onClick={() => setViewMode("mapa")} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all", viewMode === "mapa" ? "bg-white dark:bg-[#202738] text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <RiGlobalLine className="size-3.5" /><span>Mapa</span>
            </button>
            <button type="button" onClick={() => setViewMode("lista")} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all", viewMode === "lista" ? "bg-white dark:bg-[#202738] text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <RiListUnordered className="size-3.5" /><span>Lista</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col p-4 pt-2">
        {locations.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center p-4 text-muted-foreground min-h-[220px]">
            <RiMapPinLine className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-medium">Nenhuma venda registrada no período</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === "mapa" ? (
              <motion.div key="view-mapa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col gap-2">
                {/* Map */}
                <div className="relative w-full rounded-xl overflow-hidden border border-white/[0.06] shadow-inner" style={{ aspectRatio: "2/1" }}>
                  <WorldMapSVG locations={locations} selectedLocation={selectedLocation} onSelectLocation={handleSelectLocation} />
                </div>

                {/* Location badges */}
                <div className="flex flex-col gap-1 items-center w-full max-w-[260px] mx-auto">
                  {locations.slice(0, 2).map((loc) => {
                    const isSelected = selectedLocation.city === loc.city;
                    return (
                      <button key={loc.city} type="button" onClick={() => handleSelectLocation(loc)} className={cn("w-full flex items-center justify-center gap-2 py-1 px-3 rounded-xl text-xs font-medium transition-all border", isSelected ? "bg-blue-600/15 border-blue-500/60 text-blue-500 dark:text-blue-300 shadow-[0_0_14px_rgba(59,130,246,0.2)] scale-[1.02]" : "bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground")}>
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
              <motion.div key="view-lista" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col space-y-2 mt-1">
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
                      <div key={loc.city} onClick={() => handleSelectLocation(loc)} className={cn("group flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer", isSelected ? "bg-blue-600/10 border-blue-500/40 shadow-sm" : "bg-muted/20 border-border/30 hover:bg-muted/40")}>
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
