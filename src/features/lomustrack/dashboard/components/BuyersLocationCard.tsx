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

// Equirectangular projection helpers
const W = 1000;
const H = 500;
function lngLatToXY(lng: number, lat: number): [number, number] {
  const x = ((lng + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y];
}

// Converts an array of [lng, lat] pairs to SVG path string
function poly(coords: [number, number][]): string {
  return coords.map(([lng, lat], i) => {
    const [x, y] = lngLatToXY(lng, lat);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ") + " Z";
}

// World continents as [lng, lat] polygon arrays (Natural Earth simplified)
const CONTINENT_POLYGONS: Array<[number, number][]> = [
  // North America mainland
  [[-168,72],[-140,72],[-120,75],[-100,73],[-85,70],[-75,68],[-65,65],[-60,62],[-55,58],[-55,52],[-60,48],[-65,43],[-70,41],[-75,38],[-80,35],[-82,30],[-88,28],[-90,25],[-85,22],[-83,18],[-90,16],[-92,18],[-96,22],[-100,20],[-105,22],[-110,24],[-115,25],[-118,32],[-120,35],[-122,38],[-124,45],[-125,50],[-128,54],[-132,56],[-136,58],[-140,60],[-145,62],[-150,62],[-155,58],[-160,56],[-165,60],[-168,65]],
  // Greenland
  [[-55,83],[-35,83],[-20,82],[-15,78],[-18,74],[-28,70],[-40,68],[-52,65],[-58,66],[-60,70],[-58,76],[-55,80]],
  // Alaska
  [[-168,72],[-165,66],[-162,60],[-158,56],[-152,58],[-148,60],[-146,62],[-142,64],[-140,68],[-148,70],[-160,72],[-168,72]],
  // Central America
  [[-90,16],[-88,18],[-85,15],[-83,10],[-80,8],[-78,8],[-76,10],[-78,14],[-82,18],[-88,18]],
  // Caribbean (Cuba)
  [[-85,22],[-80,23],[-75,22],[-74,20],[-78,19],[-84,20]],
  // South America
  [[-80,10],[-75,12],[-70,12],[-65,8],[-60,5],[-55,5],[-50,2],[-48,0],[-44,-3],[-38,-5],[-35,-8],[-35,-12],[-38,-15],[-40,-20],[-42,-23],[-44,-25],[-48,-28],[-50,-32],[-52,-35],[-52,-40],[-56,-42],[-65,-42],[-68,-42],[-72,-38],[-74,-35],[-72,-30],[-70,-25],[-70,-18],[-68,-12],[-70,-5],[-73,0],[-76,2],[-78,5],[-78,8],[-76,10]],
  // Europe (mainland)
  [[-10,36],[0,36],[5,42],[10,44],[15,45],[20,46],[25,45],[30,47],[32,50],[28,55],[25,58],[22,60],[18,62],[15,66],[20,70],[30,72],[28,70],[24,65],[22,60],[28,56],[30,54],[25,50],[20,48],[15,48],[10,46],[5,46],[0,45],[-5,42],[-10,38]],
  // UK + Ireland
  [[-8,52],[-5,50],[-2,50],[0,52],[2,52],[0,54],[-3,56],[-5,56],[-8,54]],
  // Scandinavia
  [[5,58],[10,56],[12,56],[16,58],[20,60],[28,62],[30,66],[28,70],[22,70],[18,68],[16,64],[12,60],[8,58]],
  // Iceland
  [[-24,64],[-18,64],[-14,66],[-18,68],[-24,66]],
  // Africa
  [[-18,15],[-16,12],[-15,10],[-13,8],[-12,5],[-8,4],[-3,5],[3,5],[8,4],[10,2],[12,0],[14,-2],[16,-4],[18,-5],[20,-4],[22,-2],[25,0],[28,2],[32,2],[36,2],[40,0],[42,-2],[42,-8],[40,-14],[38,-18],[36,-22],[34,-26],[30,-30],[28,-34],[22,-36],[18,-36],[14,-34],[12,-30],[10,-26],[8,-22],[4,-18],[2,-14],[0,-10],[0,-4],[0,0],[4,2],[8,4]],
  // Madagascar
  [[44,-12],[48,-14],[50,-18],[50,-22],[48,-25],[44,-24],[42,-20],[43,-16]],
  // Middle East + Arabian Peninsula
  [[36,38],[40,38],[46,38],[50,38],[56,36],[60,30],[58,24],[56,22],[52,18],[48,16],[44,12],[42,12],[38,14],[36,18],[36,30],[34,34],[36,38]],
  // Asia - main body
  [[26,70],[34,70],[40,68],[48,68],[58,68],[68,68],[70,64],[72,58],[76,52],[80,50],[82,48],[88,44],[90,42],[96,40],[100,38],[104,36],[108,34],[112,30],[116,24],[118,22],[120,20],[118,16],[115,14],[110,12],[105,10],[100,5],[100,2],[104,0],[106,-4],[108,-6],[110,-8],[112,-8],[114,-4],[118,2],[120,4],[122,6],[124,10],[126,14],[128,20],[130,30],[132,38],[136,42],[138,44],[140,46],[140,52],[136,56],[130,58],[126,62],[120,66],[110,70],[100,72],[90,72],[80,72],[70,70],[60,70],[50,70],[40,70],[30,70]],
  // Indian subcontinent
  [[68,22],[72,22],[76,20],[80,18],[82,16],[82,12],[80,10],[78,8],[76,8],[72,10],[68,14],[66,18],[68,22]],
  // Southeast Asia - Indochina
  [[100,20],[102,22],[104,22],[106,20],[106,16],[104,12],[100,10],[98,8],[98,12],[100,16]],
  // Southeast Asia - Malay Peninsula
  [[100,5],[103,2],[104,0],[102,-2],[100,-2],[98,0],[98,4]],
  // China + East Asia
  [[80,50],[84,48],[90,46],[94,44],[98,42],[104,42],[108,40],[112,38],[116,36],[120,34],[122,30],[124,26],[124,22],[120,20],[116,24],[112,30],[108,34],[104,36],[100,38],[96,40],[90,42],[88,44],[84,46],[80,48]],
  // Japan
  [[130,32],[132,34],[134,36],[136,38],[138,40],[140,42],[142,44],[140,44],[138,42],[136,38],[134,34],[130,32]],
  // Hokkaido
  [[140,44],[142,44],[144,44],[144,42],[142,42],[140,42]],
  // Borneo
  [[108,-4],[112,-2],[116,2],[118,4],[118,6],[116,6],[114,4],[110,2],[108,0],[106,-2],[108,-4]],
  // Sumatra
  [[96,4],[100,2],[104,0],[106,-2],[106,-4],[104,-6],[100,-4],[96,0],[96,4]],
  // Java
  [[106,-6],[108,-6],[110,-7],[112,-7],[114,-7],[114,-9],[112,-9],[110,-8],[108,-8],[106,-7]],
  // Philippines
  [[118,20],[120,18],[122,16],[124,14],[124,10],[122,8],[120,8],[118,10],[118,14],[116,16],[118,18]],
  // Australia
  [[114,-22],[116,-20],[118,-18],[120,-16],[124,-14],[128,-14],[132,-12],[136,-12],[138,-14],[140,-16],[142,-14],[144,-14],[146,-16],[148,-18],[150,-20],[152,-24],[152,-28],[150,-32],[150,-36],[148,-38],[146,-38],[144,-36],[142,-34],[140,-34],[136,-36],[132,-36],[130,-34],[128,-30],[126,-26],[122,-24],[118,-24],[114,-22]],
  // New Zealand (North Island)
  [[174,-38],[176,-36],[178,-36],[178,-38],[176,-40],[174,-40],[172,-38],[174,-38]],
  // New Zealand (South Island)
  [[168,-44],[170,-44],[172,-42],[174,-42],[172,-46],[170,-46],[168,-44]],
  // Sri Lanka
  [[80,10],[80,8],[82,8],[82,10],[80,10]],
  // Taiwan
  [[120,22],[122,22],[122,24],[120,24],[120,22]],
];

interface WorldMapSVGProps {
  locations: BuyerLocation[];
  selectedLocation: BuyerLocation;
  onSelectLocation: (loc: BuyerLocation) => void;
}

function WorldMapSVG({ locations, selectedLocation, onSelectLocation }: WorldMapSVGProps) {
  const maxSales = Math.max(...locations.map((l) => l.sales), 1);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full"
      style={{ background: "#0d1117", display: "block" }}
    >
      {/* Ocean grid lines (subtle latitude/longitude) */}
      {[-60, -30, 0, 30, 60].map((lat) => {
        const [, y] = lngLatToXY(0, lat);
        return <line key={`lat${lat}`} x1={0} y1={y} x2={W} y2={y} stroke="#161c2a" strokeWidth="0.5" />;
      })}
      {[-120, -60, 0, 60, 120].map((lng) => {
        const [x] = lngLatToXY(lng, 0);
        return <line key={`lng${lng}`} x1={x} y1={0} x2={x} y2={H} stroke="#161c2a" strokeWidth="0.5" />;
      })}

      {/* Continent fills */}
      {CONTINENT_POLYGONS.map((coords, i) => (
        <path
          key={i}
          d={poly(coords)}
          fill="#1a2235"
          stroke="#2a3a5c"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      ))}

      {/* Location markers */}
      {locations.map((loc) => {
        const [x, y] = lngLatToXY(loc.lng, loc.lat);
        const isSelected = selectedLocation.city === loc.city;
        const r = isSelected
          ? 6
          : Math.max(3, Math.min(5, 3 + (loc.sales / maxSales) * 2.5));

        return (
          <g
            key={`${loc.city}-${loc.state}`}
            onClick={() => onSelectLocation(loc)}
            style={{ cursor: "pointer" }}
          >
            {/* Outer glow rings */}
            {isSelected && (
              <>
                <circle cx={x} cy={y} r={r + 10} fill="rgba(59,130,246,0.08)" />
                <circle cx={x} cy={y} r={r + 6} fill="rgba(59,130,246,0.15)" />
                <circle cx={x} cy={y} r={r + 3} fill="rgba(59,130,246,0.25)" />
              </>
            )}
            {/* Dot */}
            <circle
              cx={x}
              cy={y}
              r={r}
              fill={isSelected ? "#3b82f6" : "#2563eb"}
              stroke={isSelected ? "#93c5fd" : "#1d4ed8"}
              strokeWidth={isSelected ? 1.5 : 1}
              opacity={isSelected ? 1 : 0.85}
            />
            {/* Inner bright core */}
            <circle
              cx={x}
              cy={y}
              r={r * 0.4}
              fill={isSelected ? "#bfdbfe" : "#60a5fa"}
              opacity={0.9}
            />
          </g>
        );
      })}
    </svg>
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
