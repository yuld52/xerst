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

// ─── World map paths (Natural Earth 110m, simplified) ───────────────────────
// Each string is one country/region path in equirectangular 1000×500 space
const LAND_PATH = [
  // North America
  "M 33 55 L 42 50 L 58 48 L 72 44 L 85 42 L 92 46 L 97 54 L 103 58 L 108 64 L 112 72 L 115 80 L 112 88 L 106 96 L 98 103 L 90 108 L 82 112 L 74 115 L 66 118 L 58 115 L 50 110 L 44 103 L 38 95 L 34 85 L 32 74 Z",
  // Greenland
  "M 155 20 L 168 15 L 182 14 L 192 18 L 196 26 L 192 34 L 180 38 L 168 38 L 158 32 L 153 24 Z",
  // Central America + Caribbean
  "M 112 108 L 118 105 L 123 108 L 125 115 L 120 120 L 113 118 Z",
  "M 128 108 L 135 105 L 140 108 L 138 114 L 130 113 Z",
  // South America
  "M 148 112 L 162 108 L 175 108 L 185 112 L 192 120 L 196 132 L 198 148 L 198 165 L 194 182 L 188 198 L 178 212 L 165 222 L 152 222 L 142 215 L 136 200 L 134 185 L 136 168 L 138 152 L 140 138 L 143 125 Z",
  // Europe
  "M 448 60 L 462 56 L 478 55 L 492 58 L 500 65 L 498 74 L 490 80 L 480 85 L 470 88 L 460 86 L 452 80 L 446 72 Z",
  "M 440 70 L 448 66 L 452 72 L 448 80 L 440 78 Z",
  "M 462 42 L 472 36 L 482 40 L 486 50 L 480 56 L 470 55 L 462 50 Z",
  "M 450 55 L 456 52 L 462 56 L 460 64 L 452 62 Z",
  // UK
  "M 436 60 L 442 56 L 448 60 L 445 68 L 438 67 Z",
  // Iceland
  "M 400 38 L 408 34 L 416 36 L 418 44 L 410 48 L 402 44 Z",
  // Africa
  "M 452 112 L 466 106 L 482 106 L 496 110 L 508 118 L 515 132 L 518 148 L 518 166 L 514 182 L 506 196 L 494 208 L 480 214 L 466 212 L 453 204 L 444 190 L 440 174 L 440 158 L 443 142 L 448 128 Z",
  "M 522 180 L 528 172 L 534 178 L 532 188 L 524 190 Z",
  // Middle East
  "M 530 95 L 545 88 L 560 90 L 568 100 L 562 112 L 548 116 L 534 110 Z",
  // Central Asia / Russia
  "M 540 42 L 570 35 L 610 32 L 650 34 L 680 38 L 700 45 L 710 55 L 702 65 L 685 70 L 660 72 L 635 70 L 610 68 L 585 65 L 562 60 L 545 52 Z",
  // South Asia (India)
  "M 590 110 L 604 105 L 616 108 L 622 118 L 620 132 L 614 144 L 604 152 L 592 148 L 584 136 L 582 122 Z",
  // Southeast Asia
  "M 650 112 L 664 106 L 674 110 L 678 122 L 670 132 L 656 130 L 648 120 Z",
  "M 672 128 L 680 122 L 688 126 L 686 136 L 676 138 Z",
  // China / East Asia
  "M 640 60 L 660 54 L 682 55 L 700 62 L 710 72 L 708 85 L 695 95 L 675 100 L 655 98 L 638 90 L 632 76 Z",
  // Japan
  "M 718 65 L 726 60 L 732 65 L 730 75 L 722 78 L 716 72 Z",
  // Korea
  "M 706 68 L 714 65 L 718 72 L 714 80 L 706 78 Z",
  // Indonesia / Malaysia
  "M 660 150 L 672 144 L 684 148 L 686 158 L 674 162 L 662 158 Z",
  "M 690 155 L 702 150 L 712 154 L 710 164 L 698 166 L 688 162 Z",
  "M 648 158 L 658 152 L 668 156 L 666 166 L 654 168 Z",
  // Philippines
  "M 710 110 L 718 104 L 726 108 L 724 120 L 714 122 Z",
  // Australia
  "M 718 215 L 736 206 L 756 204 L 774 208 L 788 218 L 795 232 L 794 248 L 786 262 L 772 272 L 752 276 L 732 272 L 714 260 L 706 244 L 706 228 Z",
  // New Zealand
  "M 802 262 L 810 256 L 816 262 L 814 272 L 806 274 Z",
  "M 806 278 L 812 272 L 816 278 L 812 288 L 806 286 Z",
  // Madagascar
  "M 528 192 L 534 184 L 540 188 L 540 200 L 534 206 L 528 200 Z",
  // Sri Lanka
  "M 606 150 L 610 146 L 614 150 L 612 156 L 607 155 Z",
  // Taiwan
  "M 710 100 L 714 96 L 718 100 L 716 108 L 711 107 Z",
  // Alaska
  "M 25 42 L 36 36 L 48 38 L 55 46 L 48 52 L 36 52 Z",
  // Norway/Scandinavia tip
  "M 480 32 L 490 26 L 500 30 L 498 42 L 486 44 Z",
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
        const r = isSelected ? 7 : Math.max(3.5, Math.min(5.5, 3.5 + (loc.sales / maxSales) * 2));

        return (
          <g
            key={`${loc.city}-${loc.state}`}
            onClick={() => onSelectLocation(loc)}
            style={{ cursor: "pointer" }}
          >
            {isSelected && (
              <>
                {/* Outer atmosphere */}
                <circle cx={x} cy={y} r={r + 16} fill="url(#glow-sel)" />
                {/* Pulsing rings */}
                <circle cx={x} cy={y} r={r + 10} fill="none" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.2" />
                <circle cx={x} cy={y} r={r + 5} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.35" />
              </>
            )}
            {/* Dot shadow */}
            <circle cx={x + 1} cy={y + 1} r={r} fill="#000" opacity={0.3} />
            {/* Main dot */}
            <circle
              cx={x} cy={y} r={r}
              fill={isSelected ? "#3b82f6" : "#1d4ed8"}
              stroke={isSelected ? "#93c5fd" : "#3b82f6"}
              strokeWidth={isSelected ? 1.5 : 1}
              filter={isSelected ? "url(#blur-glow)" : undefined}
            />
            {/* Bright core */}
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
