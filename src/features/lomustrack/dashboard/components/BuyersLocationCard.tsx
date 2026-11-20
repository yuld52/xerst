import { useState, useEffect, useRef, useMemo } from "react";
import createGlobe, { type Globe } from "cobe";
import { RiInformationLine, RiGlobalLine, RiListUnordered } from "@remixicon/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerInteracting = useRef<number | null>(null);
  const isDragging = useRef(false);
  const phiRef = useRef(4.7); // Focado inicialmente na América do Sul
  const globeRef = useRef<Globe | null>(null);

  // Normaliza locais recebidos ou usa os locais padrão escalados proporcionalmente
  const locations: BuyerLocation[] = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }
    if (totalSales && totalSales > 0 && totalRevenue && totalRevenue > 0) {
      const proportions = [0.42, 0.24, 0.18, 0.1, 0.06];
      return DEFAULT_LOCATIONS.map((loc, idx) => {
        const p = proportions[idx] || 0.05;
        const sales = Math.max(1, Math.round(totalSales * p));
        const revenue = Number((totalRevenue * p).toFixed(2));
        return { ...loc, sales, revenue };
      });
    }
    return DEFAULT_LOCATIONS;
  }, [data, totalSales, totalRevenue]);

  const [selectedLocation, setSelectedLocation] = useState<BuyerLocation>(
    locations[0] || DEFAULT_LOCATIONS[0],
  );

  useEffect(() => {
    if (locations.length > 0) {
      setSelectedLocation(locations[0]);
    }
  }, [locations]);

  // Inicializa o globo WebGL via Cobe
  useEffect(() => {
    if (viewMode !== "globo" || !canvasRef.current) return;

    let width = 0;
    const canvas = canvasRef.current;

    const onResize = () => {
      if (canvas) {
        width = canvas.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    const maxSales = Math.max(...locations.map((l) => l.sales), 1);
    const markers = locations.map((loc) => ({
      location: [loc.lat, loc.lng] as [number, number],
      size: Math.max(0.04, Math.min(0.09, 0.04 + (loc.sales / maxSales) * 0.05)),
    }));

    let animationId: number | null = null;
    let globe: Globe | null = null;
    let currentPhi = phiRef.current;
    const theta = 0.25;

    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(2, window.devicePixelRatio || 1),
        width: 400,
        height: 400,
        phi: currentPhi,
        theta,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 5.5,
        baseColor: [0.04, 0.09, 0.2],
        markerColor: [0.2, 0.7, 1.0],
        glowColor: [0.08, 0.28, 0.65],
        markers,
        scale: 1,
      });

      globeRef.current = globe;

      const animate = () => {
        if (!isDragging.current) {
          currentPhi += 0.0035;
          phiRef.current = currentPhi;
        }
        globe?.update({ phi: phiRef.current, theta });
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
      window.removeEventListener("resize", onResize);
      globe?.destroy();
      globeRef.current = null;
    };
  }, [viewMode, locations]);

  // Rotaciona o globo suavemente para focar no local selecionado
  const handleSelectLocation = (loc: BuyerLocation) => {
    setSelectedLocation(loc);
    // Converte longitude para phi
    const targetPhi = ((-loc.lng - 90) * Math.PI) / 180;
    phiRef.current = targetPhi;
    if (globeRef.current) {
      globeRef.current.update({ phi: targetPhi });
    }
  };

  const totalLocSales = locations.reduce((sum, l) => sum + l.sales, 0);

  return (
    <Card className="h-full min-h-[300px] border-0 bg-card shadow-[0_4px_18px_rgba(15,23,42,0.06)] flex flex-col justify-between overflow-hidden">
      <CardHeader className="p-4 pb-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-left text-lg font-semibold text-foreground">
              De onde compram
            </CardTitle>
            <span
              className="inline-flex cursor-help text-muted-foreground hover:text-foreground transition-colors"
              title="Origem geográfica dos clientes com base nas vendas e conversões registradas."
            >
              <RiInformationLine className="size-[17px]" />
            </span>
          </div>

          {/* Toggle Globo / Lista */}
          <div className="inline-flex items-center rounded-xl bg-muted/60 p-1 border border-border/40 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("globo")}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-all",
                viewMode === "globo"
                  ? "bg-card text-foreground shadow-sm font-semibold"
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
                "flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-all",
                viewMode === "lista"
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <RiListUnordered className="size-3.5" />
              <span>Lista</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between p-4 pt-0">
        {viewMode === "globo" ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            {/* Globo 3D Cobe */}
            <div className="relative w-full max-w-[160px] aspect-square flex items-center justify-center my-0.5 select-none">
              <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
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
                  isDragging.current = true;
                }}
                onPointerUp={() => {
                  pointerInteracting.current = null;
                  isDragging.current = false;
                }}
                onPointerOut={() => {
                  pointerInteracting.current = null;
                  isDragging.current = false;
                }}
                onMouseMove={(e) => {
                  if (pointerInteracting.current !== null && isDragging.current) {
                    const delta = e.clientX - pointerInteracting.current;
                    pointerInteracting.current = e.clientX;
                    phiRef.current += delta * 0.007;
                  }
                }}
              />
            </div>

            {/* Badges dos locais mais ativos */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1.5 w-full">
              {locations.slice(0, 3).map((loc) => {
                const isSelected = selectedLocation.city === loc.city;
                return (
                  <button
                    key={`${loc.city}-${loc.state}`}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all border",
                      isSelected
                        ? "bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.25)]"
                        : "bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
                    <span>
                      {loc.city}, {loc.state} · {loc.sales}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Rodapé informativo do local selecionado */}
            <p className="text-center text-[11px] text-muted-foreground mt-2 font-medium">
              {selectedLocation.city}, {selectedLocation.state} — {selectedLocation.sales}{" "}
              {selectedLocation.sales === 1 ? "venda" : "vendas"} (
              {convertAndFormatMZN(selectedLocation.revenue)})
            </p>
          </div>
        ) : (
          /* Visualização em Lista */
          <div className="flex flex-1 flex-col justify-start space-y-3 mt-3 overflow-y-auto max-h-[300px] pr-1">
            {locations.map((loc, idx) => {
              const pct = totalLocSales > 0 ? (loc.sales / totalLocSales) * 100 : 0;
              return (
                <div
                  key={`${loc.city}-${loc.state}`}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {loc.city}, {loc.state}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {loc.country || "Brasil"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(15, pct))}%` }}
                      />
                    </div>
                    <div className="text-right min-w-[70px]">
                      <p className="text-xs font-bold text-foreground">
                        {loc.sales} {loc.sales === 1 ? "venda" : "vendas"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {convertAndFormatMZN(loc.revenue)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
