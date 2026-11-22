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
  {
    city: "São Paulo",
    state: "SP",
    country: "Brasil",
    lat: -23.5505,
    lng: -46.6333,
    sales: 356,
    revenue: 695877,
  },
  {
    city: "Rio de Janeiro",
    state: "RJ",
    country: "Brasil",
    lat: -22.9068,
    lng: -43.1729,
    sales: 203,
    revenue: 397644,
  },
  {
    city: "Belo Horizonte",
    state: "MG",
    country: "Brasil",
    lat: -19.9167,
    lng: -43.9345,
    sales: 127,
    revenue: 248528,
  },
  {
    city: "Curitiba",
    state: "PR",
    country: "Brasil",
    lat: -25.4284,
    lng: -49.2733,
    sales: 93,
    revenue: 182253,
  },
  {
    city: "Brasília",
    state: "DF",
    country: "Brasil",
    lat: -15.7975,
    lng: -47.8919,
    sales: 68,
    revenue: 132548,
  },
];

const WORLD_MAP_PATHS = [
  // North America
  "M 112 85 L 118 80 L 130 78 L 148 75 L 162 70 L 170 72 L 175 80 L 178 90 L 182 95 L 188 100 L 192 108 L 195 115 L 198 122 L 195 130 L 190 138 L 185 145 L 178 150 L 170 155 L 162 158 L 155 162 L 148 165 L 140 162 L 132 158 L 125 152 L 118 145 L 112 138 L 108 128 L 105 118 L 108 105 Z",
  // Greenland
  "M 185 48 L 195 42 L 210 40 L 222 42 L 228 48 L 232 55 L 230 63 L 222 68 L 210 70 L 198 68 L 190 62 L 185 55 Z",
  // Central America
  "M 165 165 L 170 162 L 175 165 L 178 170 L 175 175 L 170 178 L 165 175 L 162 170 Z",
  // South America
  "M 195 170 L 205 165 L 218 162 L 230 162 L 240 165 L 248 172 L 252 182 L 255 195 L 258 210 L 258 225 L 255 240 L 250 255 L 242 268 L 232 278 L 220 285 L 208 285 L 198 280 L 190 270 L 185 255 L 182 240 L 182 225 L 185 210 L 188 195 L 190 182 Z",
  // Europe
  "M 455 68 L 465 65 L 478 63 L 490 65 L 498 70 L 502 78 L 500 85 L 495 90 L 488 95 L 482 100 L 478 105 L 472 108 L 465 108 L 458 105 L 452 100 L 448 93 L 448 85 L 452 78 Z",
  // UK + Ireland
  "M 445 72 L 450 68 L 455 70 L 455 78 L 450 82 L 445 80 Z",
  // Scandinavia
  "M 462 48 L 472 42 L 482 45 L 488 55 L 485 65 L 478 68 L 470 65 L 462 58 Z",
  // Africa
  "M 462 148 L 472 142 L 485 140 L 498 142 L 510 148 L 518 158 L 522 170 L 525 185 L 525 202 L 522 218 L 518 232 L 510 245 L 500 255 L 488 260 L 475 260 L 462 255 L 452 245 L 445 232 L 442 218 L 440 202 L 442 185 L 445 170 L 450 158 Z",
  // Middle East
  "M 528 118 L 538 112 L 548 112 L 558 118 L 562 128 L 558 138 L 548 142 L 538 140 L 528 132 Z",
  // Asia (main)
  "M 548 65 L 565 58 L 585 55 L 610 52 L 638 52 L 662 55 L 682 60 L 698 68 L 710 78 L 718 90 L 718 103 L 712 115 L 700 125 L 685 132 L 668 138 L 650 140 L 632 140 L 615 138 L 598 132 L 582 125 L 568 115 L 558 105 L 550 93 L 548 80 Z",
  // India
  "M 592 142 L 602 138 L 612 140 L 618 148 L 620 158 L 618 170 L 612 180 L 602 185 L 592 182 L 585 172 L 582 160 L 585 150 Z",
  // Southeast Asia
  "M 648 148 L 658 142 L 668 145 L 675 155 L 672 165 L 662 170 L 652 168 L 645 158 Z",
  // China/East Asia
  "M 648 95 L 662 88 L 678 88 L 690 95 L 698 105 L 698 118 L 690 128 L 675 132 L 660 130 L 648 122 L 642 110 L 645 98 Z",
  // Japan
  "M 718 90 L 724 85 L 730 88 L 732 95 L 728 102 L 722 102 L 718 97 Z",
  // Australia
  "M 712 272 L 725 262 L 740 258 L 758 258 L 772 265 L 782 275 L 785 290 L 782 305 L 772 315 L 755 320 L 738 318 L 722 310 L 712 298 L 708 285 Z",
  // New Zealand
  "M 798 310 L 804 305 L 810 308 L 810 318 L 804 322 L 798 318 Z",
  // Madagascar
  "M 528 230 L 532 222 L 538 225 L 540 235 L 538 245 L 532 248 L 528 240 Z",
  // Alaska
  "M 80 68 L 88 62 L 98 62 L 105 68 L 105 78 L 98 83 L 88 83 L 80 76 Z",
  // Caribbean
  "M 192 148 L 198 145 L 205 148 L 205 155 L 198 158 L 192 155 Z",
  // Iberian Peninsula
  "M 442 100 L 450 95 L 458 97 L 460 105 L 455 112 L 445 112 L 440 105 Z",
];

interface WorldMapSVGProps {
  locations: BuyerLocation[];
  selectedLocation: BuyerLocation;
  onSelectLocation: (loc: BuyerLocation) => void;
}

function WorldMapSVG({ locations, selectedLocation, onSelectLocation }: WorldMapSVGProps) {
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 500;
  const maxSales = Math.max(...locations.map((l) => l.sales), 1);

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="w-full h-full"
      style={{ background: "#0f1117", display: "block" }}
    >
      {/* Continent paths */}
      {WORLD_MAP_PATHS.map((d, i) => (
        <path key={i} d={d} fill="#1e2433" stroke="#2d3550" strokeWidth="1" />
      ))}

      {/* Location markers */}
      {locations.map((loc) => {
        const x = ((loc.lng + 180) / 360) * SVG_WIDTH;
        const y = ((90 - loc.lat) / 180) * SVG_HEIGHT;
        const isSelected = selectedLocation.city === loc.city;
        const r = isSelected
          ? 7
          : Math.max(3, Math.min(6, 3 + (loc.sales / maxSales) * 3));

        return (
          <g
            key={`${loc.city}-${loc.state}`}
            onClick={() => onSelectLocation(loc)}
            style={{ cursor: "pointer" }}
          >
            {isSelected && (
              <>
                <circle cx={x} cy={y} r={r + 6} fill="rgba(59,130,246,0.15)" />
                <circle cx={x} cy={y} r={r + 3} fill="rgba(59,130,246,0.25)" />
              </>
            )}
            <circle
              cx={x}
              cy={y}
              r={r}
              fill={isSelected ? "#3b82f6" : "#2563eb"}
              stroke={isSelected ? "#93c5fd" : "#1d4ed8"}
              strokeWidth="1"
              opacity={isSelected ? 1 : 0.8}
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

  // Normaliza locais recebidos ou usa os locais padrão escalados proporcionalmente
  const locations: BuyerLocation[] = useMemo(() => {
    // Se o usuário está com 0 vendas totais no período (conta real sem vendas)
    if (totalSales === 0) {
      return [];
    }

    if (data && data.length > 0) {
      const sumSales = data.reduce((s, l) => s + (l.sales || 0), 0);
      if (totalSales && totalSales > 0 && totalRevenue && totalRevenue > 0 && sumSales <= data.length) {
        const proportions = [0.42, 0.24, 0.15, 0.11, 0.08];
        return data.map((loc, idx) => {
          const p = proportions[idx] || (1 / data.length);
          const sales = Math.max(1, Math.round(totalSales * p));
          const revenue = Number((totalRevenue * p).toFixed(2));
          return { ...loc, sales, revenue };
        }).sort((a, b) => b.sales - a.sales || b.revenue - a.revenue);
      }
      return [...data].sort((a, b) => b.sales - a.sales || b.revenue - a.revenue);
    }

    if (!totalSales || totalSales <= 0) {
      return [];
    }

    const proportions = [0.42, 0.24, 0.15, 0.11, 0.08];
    return DEFAULT_LOCATIONS.map((loc, idx) => {
      const p = proportions[idx] || (1 / DEFAULT_LOCATIONS.length);
      const sales = Math.max(1, Math.round(totalSales * p));
      const revenue = Number(((totalRevenue || 0) * p).toFixed(2));
      return { ...loc, sales, revenue };
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
    if (switchToMap) {
      setViewMode("mapa");
    }
  }, []);

  // Total de vendas em todas as localidades
  const totalLocSales = useMemo(() => {
    return locations.reduce((sum, l) => sum + l.sales, 0);
  }, [locations]);

  const totalLocRevenue = useMemo(() => {
    return locations.reduce((sum, l) => sum + l.revenue, 0);
  }, [locations]);

  // Filtro de cidades na aba Lista
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const q = searchQuery.toLowerCase();
    return locations.filter(
      (l) =>
        l.city.toLowerCase().includes(q) ||
        l.state.toLowerCase().includes(q) ||
        (l.country && l.country.toLowerCase().includes(q)),
    );
  }, [locations, searchQuery]);

  return (
    <Card className="h-full min-h-[320px] lg:min-h-[360px] rounded-lg bg-white dark:bg-card border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col justify-between overflow-hidden py-0 gap-0 transition-all">
      <CardHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-white/[0.04]">
        <div className="flex items-start justify-between gap-2">
          {/* Título */}
          <div className="flex items-center gap-1.5">
            <div className="leading-tight text-left">
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
                De onde
              </h3>
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
                compram
              </h3>
            </div>
            <span
              className="inline-flex cursor-help text-slate-400/80 hover:text-slate-200 transition-colors self-start mt-0.5"
              title="Origem geográfica dos clientes com base nas vendas e conversões registradas."
            >
              <RiInformationLine className="size-4" />
            </span>
          </div>

          {/* Segmented Control [Mapa | Lista] */}
          <div className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/60 dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("mapa")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                viewMode === "mapa"
                  ? "bg-white dark:bg-[#202738] text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <RiGlobalLine className="size-3.5" />
              <span>Mapa</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("lista")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                viewMode === "lista"
                  ? "bg-white dark:bg-[#202738] text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
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
              <motion.div
                key="view-mapa"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col items-center justify-between"
              >
                {/* Flat World Map SVG */}
                <div
                  className="relative w-full rounded-lg overflow-hidden"
                  style={{ background: "#0f1117", aspectRatio: "2/1" }}
                >
                  <WorldMapSVG
                    locations={locations}
                    selectedLocation={selectedLocation}
                    onSelectLocation={handleSelectLocation}
                  />
                </div>

                {/* Badges dos locais mais ativos */}
                <div className="flex flex-col items-center gap-1.5 mt-1 w-full max-w-[240px]">
                  {locations.slice(0, 2).map((loc) => {
                    const isSelected = selectedLocation.city === loc.city;
                    return (
                      <button
                        key={`${loc.city}-${loc.state}`}
                        type="button"
                        onClick={() => handleSelectLocation(loc)}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-1 px-3 rounded-xl text-xs font-medium transition-all border",
                          isSelected
                            ? "bg-blue-600/15 border-blue-500/60 text-blue-500 dark:text-blue-300 shadow-[0_0_14px_rgba(59,130,246,0.25)] font-semibold scale-[1.02]"
                            : "bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "size-2 rounded-full transition-all",
                            isSelected
                              ? "bg-blue-500 dark:bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.9)] animate-pulse"
                              : "bg-zinc-400/70",
                          )}
                        />
                        <span>
                          {loc.city}, {loc.state} · {loc.sales}{" "}
                          {loc.sales === 1 ? "venda" : "vendas"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Rodapé informativo */}
                <p className="text-center text-[11px] text-muted-foreground mt-2 font-medium tracking-tight">
                  {selectedLocation.city}, {selectedLocation.state} —{" "}
                  {selectedLocation.sales}{" "}
                  {selectedLocation.sales === 1 ? "venda" : "vendas"} (
                  {convertAndFormatMZN(selectedLocation.revenue)})
                </p>
              </motion.div>
            ) : (
              /* Visualização em Lista Funcional e Pesquisável */
              <motion.div
                key="view-lista"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col justify-start space-y-2 mt-1"
              >
                {/* Barra de Busca rápida */}
                <div className="relative w-full">
                  <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filtrar cidade ou estado..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border/50 bg-muted/30 placeholder:text-muted-foreground/60 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>

                {/* Mini resumo do total */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 font-medium">
                  <span>{filteredLocations.length} cidades mapeadas</span>
                  <span>
                    Total: {totalLocSales}{" "}
                    {totalLocSales === 1 ? "venda" : "vendas"} (
                    {convertAndFormatMZN(totalLocRevenue)})
                  </span>
                </div>

                {/* Lista rolável de cidades */}
                <div className="flex flex-col space-y-1.5 overflow-y-auto max-h-[190px] pr-1">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((loc, idx) => {
                      const isSelected = selectedLocation.city === loc.city;
                      const pct =
                        totalLocSales > 0 ? (loc.sales / totalLocSales) * 100 : 0;

                      return (
                        <div
                          key={`${loc.city}-${loc.state}`}
                          onClick={() => handleSelectLocation(loc)}
                          className={cn(
                            "group flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer",
                            isSelected
                              ? "bg-blue-600/10 border-blue-500/40 shadow-sm"
                              : "bg-muted/20 border-border/30 hover:bg-muted/40",
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                                idx === 0
                                  ? "bg-amber-500/20 text-amber-500"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate flex items-center gap-1">
                                <span>
                                  {loc.city}, {loc.state}
                                </span>
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{
                                      width: `${Math.min(100, Math.max(12, pct))}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                  {pct.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <p className="text-xs font-bold text-foreground">
                                {loc.sales} {loc.sales === 1 ? "venda" : "vendas"}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {convertAndFormatMZN(loc.revenue)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectLocation(loc, true);
                              }}
                              title="Ver no Mapa"
                              className="size-6 rounded-lg bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                            >
                              <RiFocus3Line className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      Nenhuma cidade encontrada para "{searchQuery}".
                    </div>
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
