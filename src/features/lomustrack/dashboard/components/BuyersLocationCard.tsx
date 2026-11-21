import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import createGlobe, { type Globe } from "cobe";
import {
  RiInformationLine,
  RiGlobalLine,
  RiListUnordered,
  RiSearchLine,
  RiFocus3Line,
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
    sales: 1,
    revenue: 217.19,
  },
  {
    city: "Belo Horizonte",
    state: "MG",
    country: "Brasil",
    lat: -19.9167,
    lng: -43.9345,
    sales: 1,
    revenue: 189.9,
  },
  {
    city: "Rio de Janeiro",
    state: "RJ",
    country: "Brasil",
    lat: -22.9068,
    lng: -43.1729,
    sales: 1,
    revenue: 197.5,
  },
  {
    city: "Curitiba",
    state: "PR",
    country: "Brasil",
    lat: -25.4284,
    lng: -49.2733,
    sales: 1,
    revenue: 154.0,
  },
  {
    city: "Brasília",
    state: "DF",
    country: "Brasil",
    lat: -15.7975,
    lng: -47.8919,
    sales: 1,
    revenue: 178.0,
  },
];

export function BuyersLocationCard({
  data,
  totalSales,
  totalRevenue,
}: BuyersLocationCardProps) {
  const [viewMode, setViewMode] = useState<"globo" | "lista">("globo");
  const [searchQuery, setSearchQuery] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Controle de rotação e física do globo
  const pointerInteracting = useRef<number | null>(null);
  const pointerYInteracting = useRef<number | null>(null);
  const isDragging = useRef(false);
  const lastInteractionTime = useRef(Date.now());
  const phiRef = useRef(4.7);
  const thetaRef = useRef(0.25);
  const targetPhi = useRef(4.7);
  const targetTheta = useRef(0.25);
  const globeRef = useRef<Globe | null>(null);

  // Normaliza locais recebidos ou usa os locais padrão escalados proporcionalmente
  const locations: BuyerLocation[] = useMemo(() => {
    if (data && data.length > 0) {
      return [...data].sort((a, b) => b.sales - a.sales || b.revenue - a.revenue);
    }
    if (totalSales && totalSales > 0 && totalRevenue && totalRevenue > 0) {
      const proportions = [0.42, 0.24, 0.18, 0.1, 0.06];
      return DEFAULT_LOCATIONS.map((loc, idx) => {
        const p = proportions[idx] || 0.05;
        const sales = Math.max(1, Math.round(totalSales * p));
        const revenue = Number((totalRevenue * p).toFixed(2));
        return { ...loc, sales, revenue };
      }).sort((a, b) => b.sales - a.sales);
    }
    return DEFAULT_LOCATIONS;
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

  // Rotaciona o globo suavemente para focar no local selecionado
  const handleSelectLocation = useCallback((loc: BuyerLocation, switchToGlobe = false) => {
    setSelectedLocation(loc);
    lastInteractionTime.current = Date.now();

    // Converte coordenadas geográficas para os ângulos phi e theta do Cobe
    const phi = ((-loc.lng - 90) * Math.PI) / 180;
    targetPhi.current = phi;

    const thetaTarget = (loc.lat * Math.PI) / 180 * -0.4;
    targetTheta.current = Math.max(-0.4, Math.min(0.4, thetaTarget));

    if (switchToGlobe) {
      setViewMode("globo");
    }
  }, []);

  // Inicializa o globo WebGL via Cobe com física suave e animação contínua
  useEffect(() => {
    if (viewMode !== "globo" || !canvasRef.current) return;

    const canvas = canvasRef.current;
    let animationId: number | null = null;
    let globe: Globe | null = null;

    const maxSales = Math.max(...locations.map((l) => l.sales), 1);
    const markers = locations.map((loc) => {
      const isSelected = selectedLocation.city === loc.city;
      return {
        location: [loc.lat, loc.lng] as [number, number],
        size: isSelected
          ? 0.11
          : Math.max(0.045, Math.min(0.085, 0.045 + (loc.sales / maxSales) * 0.04)),
      };
    });

    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(2, window.devicePixelRatio || 1),
        width: 440,
        height: 440,
        phi: phiRef.current,
        theta: thetaRef.current,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 18000,
        mapBrightness: 6,
        baseColor: [1, 1, 1],
        markerColor: [0.2, 0.7, 1.0],
        glowColor: [0.1, 0.35, 0.8],
        markers,
        scale: 1,
      });

      globeRef.current = globe;

      const animate = () => {
        const now = Date.now();
        // Se o usuário não interagiu nos últimos 3.5 segundos, rotaciona lentamente
        if (!isDragging.current && now - lastInteractionTime.current > 3500) {
          targetPhi.current += 0.0022;
        }

        // Interpolação suave (lerp) para suavizar a transição
        if (!isDragging.current) {
          phiRef.current += (targetPhi.current - phiRef.current) * 0.07;
          thetaRef.current += (targetTheta.current - thetaRef.current) * 0.07;
        }

        globe?.update({ phi: phiRef.current, theta: thetaRef.current });
        animationId = requestAnimationFrame(animate);
      };

      animationId = requestAnimationFrame(animate);

      // Fade-in canvas suave
      setTimeout(() => {
        if (canvas) canvas.style.opacity = "1";
      }, 50);
    } catch (err) {
      console.warn("WebGL não disponível para o globo:", err);
    }

    return () => {
      if (animationId !== null) cancelAnimationFrame(animationId);
      globe?.destroy();
      globeRef.current = null;
    };
  }, [viewMode, locations, selectedLocation.city]);

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
    <Card className="h-full min-h-[310px] rounded-lg bg-white dark:bg-[#283046] border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col justify-between overflow-hidden transition-all">
      <CardHeader className="p-4 sm:p-5 pb-2">
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

          {/* Segmented Control [Globo | Lista] */}
          <div className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/60 dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("globo")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                viewMode === "globo"
                  ? "bg-white dark:bg-[#202738] text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <RiGlobalLine className="size-3.5" />
              <span>Globo</span>
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
        <AnimatePresence mode="wait">
          {viewMode === "globo" ? (
            <motion.div
              key="view-globo"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col items-center justify-between"
            >
              {/* Globo 3D Cobe com halo azul luminoso 21st.dev */}
              <div className="relative w-full max-w-[170px] aspect-square flex items-center justify-center my-0.5 select-none">
                {/* Glow atmosférico em degradê radial */}
                <div className="absolute inset-0 rounded-full bg-blue-500/15 dark:bg-blue-500/20 blur-xl pointer-events-none" />
                <div className="absolute inset-2 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />

                <canvas
                  ref={canvasRef}
                  style={{
                    width: "100%",
                    height: "100%",
                    aspectRatio: "1",
                    contain: "layout paint size",
                    opacity: 0,
                    transition: "opacity 0.6s ease",
                  }}
                  className="touch-none cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => {
                    pointerInteracting.current = e.clientX;
                    pointerYInteracting.current = e.clientY;
                    isDragging.current = true;
                    lastInteractionTime.current = Date.now();
                  }}
                  onPointerUp={() => {
                    pointerInteracting.current = null;
                    pointerYInteracting.current = null;
                    isDragging.current = false;
                    lastInteractionTime.current = Date.now();
                  }}
                  onPointerOut={() => {
                    pointerInteracting.current = null;
                    pointerYInteracting.current = null;
                    isDragging.current = false;
                    lastInteractionTime.current = Date.now();
                  }}
                  onMouseMove={(e) => {
                    if (isDragging.current && pointerInteracting.current !== null) {
                      const deltaX = e.clientX - pointerInteracting.current;
                      pointerInteracting.current = e.clientX;
                      targetPhi.current += deltaX * 0.007;
                      phiRef.current = targetPhi.current;

                      if (pointerYInteracting.current !== null) {
                        const deltaY = e.clientY - pointerYInteracting.current;
                        pointerYInteracting.current = e.clientY;
                        targetTheta.current = Math.max(
                          -0.45,
                          Math.min(0.45, targetTheta.current + deltaY * 0.005),
                        );
                        thetaRef.current = targetTheta.current;
                      }
                    }
                  }}
                />
              </div>

              {/* Badges dos locais mais ativos no estilo 21st.dev */}
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
                        {loc.city}, {loc.state} · {loc.sales}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Rodapé informativo do local selecionado no 21st.dev */}
              <p className="text-center text-[11px] text-muted-foreground mt-2 font-medium tracking-tight">
                {selectedLocation.city}, {selectedLocation.state} — {selectedLocation.sales}{" "}
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
                  Total: {totalLocSales} vendas ({convertAndFormatMZN(totalLocRevenue)})
                </span>
              </div>

              {/* Lista rolável de cidades */}
              <div className="flex flex-col space-y-1.5 overflow-y-auto max-h-[190px] pr-1">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc, idx) => {
                    const isSelected = selectedLocation.city === loc.city;
                    const pct = totalLocSales > 0 ? (loc.sales / totalLocSales) * 100 : 0;

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
                                  style={{ width: `${Math.min(100, Math.max(12, pct))}%` }}
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
                            title="Ver e focar no Globo"
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
      </CardContent>
    </Card>
  );
}
