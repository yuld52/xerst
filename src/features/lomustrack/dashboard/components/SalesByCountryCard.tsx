import { useState, useEffect, useMemo, useRef } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import {
  RiGlobalLine,
  RiListUnordered,
  RiMapPinLine,
} from "@remixicon/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { convertAndFormatMZN } from "@/utils/format";
import { cn } from "@/lib/utils";
import { fetchSalesByCountry } from "@/services/dashboard";
import type { SalesByCountry } from "@/services/dashboard";

interface SalesByCountryCardProps {
  startDate?: string;
  endDate?: string;
}

// ─── Flag emoji helper ────────────────────────────────────────────────────────
function countryFlag(code: string): string {
  try {
    return String.fromCodePoint(
      ...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)),
    );
  } catch {
    return "🌐";
  }
}

// ─── ISO numeric → ISO alpha-2 (comprehensive, 180+ countries) ───────────────
const NUM_TO_A2: Record<string, string> = {
  "004":"AF","008":"AL","012":"DZ","024":"AO","032":"AR","036":"AU","040":"AT",
  "050":"BD","056":"BE","068":"BO","076":"BR","100":"BG","104":"MM","116":"KH",
  "120":"CM","124":"CA","144":"LK","152":"CL","156":"CN","170":"CO","188":"CR",
  "191":"HR","192":"CU","196":"CY","203":"CZ","204":"BJ","208":"DK","214":"DO",
  "218":"EC","818":"EG","222":"SV","246":"FI","250":"FR","266":"GA","276":"DE",
  "288":"GH","300":"GR","320":"GT","332":"HT","340":"HN","348":"HU","356":"IN",
  "360":"ID","364":"IR","368":"IQ","372":"IE","376":"IL","380":"IT","388":"JM",
  "392":"JP","400":"JO","404":"KE","408":"KP","410":"KR","414":"KW","418":"LA",
  "422":"LB","426":"LS","434":"LY","442":"LU","450":"MG","454":"MW","458":"MY",
  "466":"ML","484":"MX","504":"MA","508":"MZ","516":"NA","524":"NP","528":"NL",
  "554":"NZ","558":"NI","566":"NG","578":"NO","586":"PK","591":"PA","600":"PY",
  "604":"PE","608":"PH","616":"PL","620":"PT","630":"PR","634":"QA","642":"RO",
  "643":"RU","646":"RW","682":"SA","686":"SN","694":"SL","706":"SO","710":"ZA",
  "724":"ES","729":"SD","752":"SE","756":"CH","760":"SY","762":"TJ","764":"TH",
  "780":"TT","788":"TN","792":"TR","800":"UG","804":"UA","784":"AE","826":"GB",
  "840":"US","858":"UY","860":"UZ","862":"VE","704":"VN","887":"YE","894":"ZM",
  "716":"ZW","012":"DZ","031":"AZ","051":"AM","112":"BY","398":"KZ","496":"MN",
  "417":"KG","795":"TM","703":"SK","705":"SI","070":"BA","807":"MK","499":"ME",
  "688":"RS","008":"AL","020":"AD","470":"MT","492":"MC","674":"SM","336":"VA",
  "233":"EE","428":"LV","440":"LT","096":"BN","090":"SB","242":"FJ","548":"VU",
  "598":"PG","316":"GU","540":"NC","258":"PF","024":"AO",
};

// ─── Tooltip state ─────────────────────────────────────────────────────────
interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  country: SalesByCountry;
  pct: string;
}

// ─── Map sub-component ────────────────────────────────────────────────────────
interface WorldCountryMapSVGProps {
  data: SalesByCountry[];
  totalSales: number;
}

const MAP_W = 960;
const MAP_H = 500;

function WorldCountryMapSVG({ data, totalSales }: WorldCountryMapSVGProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [geoPaths, setGeoPaths] = useState<{ id: string; d: string }[]>([]);

  // Build lookup: alpha-2 → entry
  const salesByA2 = useMemo(() => {
    const m: Record<string, SalesByCountry> = {};
    data.forEach((d) => { m[d.country_code] = d; });
    return m;
  }, [data]);

  const maxSales = useMemo(() => Math.max(...data.map((d) => d.sales), 1), [data]);

  // Load TopoJSON from CDN once
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topo: Topology) => {
        const projection = geoNaturalEarth1()
          .scale(153)
          .translate([MAP_W / 2, MAP_H / 2]);
        const pathGen = geoPath(projection);
        const countries = feature(
          topo,
          topo.objects.countries as GeometryCollection,
        );
        const paths = countries.features.map((f, i) => ({
          id: f.id !== undefined ? String(f.id).padStart(3, "0") : `unknown-${i}`,
          d: pathGen(f) ?? "",
        }));
        setGeoPaths(paths);
      })
      .catch(() => {});
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tooltip?.visible) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip((prev) =>
      prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev,
    );
  };

  return (
    <div
      ref={wrapperRef}
      className="relative w-full select-none"
      style={{ aspectRatio: "960/500" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTooltip(null)}
    >
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="w-full h-full"
        style={{ display: "block", background: "#0d1829" }}
      >
        <defs>
          <linearGradient id="sbc-ocean" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0d1829" />
            <stop offset="100%" stopColor="#111f35" />
          </linearGradient>
        </defs>

        {/* Ocean */}
        <rect width={MAP_W} height={MAP_H} fill="url(#sbc-ocean)" />

        {/* Countries */}
        {geoPaths.map(({ id, d }) => {
          if (!d) return null;
          const a2 = NUM_TO_A2[id];
          const entry = a2 ? salesByA2[a2] : undefined;
          const fraction = entry ? entry.sales / maxSales : 0;
          const isHovered = tooltip?.country.country_code === a2;

          // Base: dark slate. With sales: blue gradient. Hovered: brighter.
          let fill = "#1e3a5c";
          if (entry && fraction > 0) {
            const boost = isHovered ? 1.2 : 1;
            const r = Math.round(Math.min(255, (30 + fraction * 29) * boost));
            const g = Math.round(Math.min(255, (58 + fraction * 60) * boost));
            const b = Math.round(Math.min(255, (92 + fraction * 150) * boost));
            fill = `rgb(${r},${g},${b})`;
          } else if (isHovered) {
            fill = "#2a4f7a";
          }

          return (
            <path
              key={id}
              d={d}
              fill={fill}
              stroke="#0d1829"
              strokeWidth={0.5}
              style={{ cursor: entry ? "pointer" : "default", transition: "fill 0.12s" }}
              onMouseEnter={(e) => {
                if (!entry) return;
                const rect = wrapperRef.current?.getBoundingClientRect();
                if (!rect) return;
                setTooltip({
                  visible: true,
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  country: entry,
                  pct: totalSales > 0 ? ((entry.sales / totalSales) * 100).toFixed(1) : "0.0",
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}

        {/* Loading placeholder */}
        {geoPaths.length === 0 && (
          <rect width={MAP_W} height={MAP_H} fill="#0d1829" />
        )}
      </svg>

      {/* Tooltip */}
      {tooltip?.visible && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-white/10 bg-[#1a2235]/95 px-3 py-2 shadow-xl backdrop-blur-sm text-xs"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            maxWidth: 200,
            transform: tooltip.x > 700 ? "translateX(-110%)" : undefined,
          }}
        >
          <p className="font-semibold text-white mb-1">
            {countryFlag(tooltip.country.country_code)}{" "}
            {tooltip.country.country_name}
          </p>
          <div className="space-y-0.5 text-slate-300">
            <p>{tooltip.country.sales} {tooltip.country.sales === 1 ? "venda" : "vendas"}</p>
            <p>{convertAndFormatMZN(tooltip.country.revenue)}</p>
            <p className="text-blue-400 font-medium">{tooltip.pct}% do total</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────
export function SalesByCountryCard({ startDate, endDate }: SalesByCountryCardProps) {
  const [viewMode, setViewMode] = useState<"mapa" | "ranking">("mapa");
  const [data, setData] = useState<SalesByCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchSalesByCountry({ start_date: startDate, end_date: endDate })
      .then((result) => {
        setData(result);
      })
      .catch(() => {
        setError("Não foi possível carregar os dados.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [startDate, endDate]);

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.sales - a.sales),
    [data],
  );

  const totalSales = useMemo(
    () => data.reduce((s, d) => s + d.sales, 0),
    [data],
  );

  return (
    <Card className="rounded-xl bg-card border border-white/[0.08] shadow-sm flex flex-col overflow-hidden min-h-[400px]">
      {/* Header */}
      <CardHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-white/[0.04]">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm sm:text-base font-semibold text-slate-100">
            Vendas por País
          </h3>
          <div className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/60 dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("mapa")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                viewMode === "mapa"
                  ? "bg-white dark:bg-[#202738] text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <RiGlobalLine className="size-3.5" />
              <span>Mapa</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("ranking")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                viewMode === "ranking"
                  ? "bg-white dark:bg-[#202738] text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <RiListUnordered className="size-3.5" />
              <span>Ranking</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col p-4 pt-3">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-3 py-2">
            <Skeleton className="h-6 w-full rounded-md" />
            <Skeleton className="h-6 w-5/6 rounded-md" />
            <Skeleton className="h-6 w-4/6 rounded-md" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <p className="text-xs text-muted-foreground text-center py-6">{error}</p>
        )}

        {/* Empty */}
        {!loading && !error && data.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center py-10 text-muted-foreground">
            <RiMapPinLine className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-medium">Nenhuma venda registrada no período</p>
          </div>
        )}

        {/* Map view */}
        {!loading && !error && data.length > 0 && viewMode === "mapa" && (
          <div className="flex flex-col gap-2">
            <div className="rounded-xl overflow-hidden border border-white/[0.06] shadow-inner">
              <WorldCountryMapSVG data={sorted} totalSales={totalSales} />
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] text-muted-foreground shrink-0">Sem vendas</span>
              <div className="flex-1 h-1.5 rounded-full" style={{
                background: "linear-gradient(to right, #1e3a5c, #1e4080, #1a5fbf, #3b82f6, #93c5fd)"
              }} />
              <span className="text-[10px] text-muted-foreground shrink-0">Mais vendas</span>
            </div>
            {/* Summary */}
            <div className="flex items-center justify-between px-1 pt-1 border-t border-white/[0.04]">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground">Países</p>
                  <p className="text-xs font-bold text-foreground">{data.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total vendas</p>
                  <p className="text-xs font-bold text-foreground">{totalSales.toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Faturamento</p>
                  <p className="text-xs font-bold text-foreground">
                    {convertAndFormatMZN(data.reduce((s, d) => s + d.revenue, 0))}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">Passe o rato sobre um país</p>
            </div>
          </div>
        )}

        {/* Ranking view */}
        {!loading && !error && data.length > 0 && viewMode === "ranking" && (
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[280px] pr-1">
            {sorted.map((entry, idx) => {
              const pct = totalSales > 0 ? (entry.sales / totalSales) * 100 : 0;
              return (
                <div
                  key={entry.country_code}
                  className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/20 px-3 py-2 hover:bg-muted/40 transition-colors"
                >
                  {/* Rank */}
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      idx === 0
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {idx + 1}
                  </span>

                  {/* Flag + name */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-base leading-none" aria-label={entry.country_name}>
                      {countryFlag(entry.country_code)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {entry.country_name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-foreground">
                      {entry.sales} {entry.sales === 1 ? "venda" : "vendas"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {convertAndFormatMZN(entry.revenue)}
                    </p>
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
