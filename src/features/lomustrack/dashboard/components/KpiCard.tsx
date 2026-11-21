import type { RemixiconComponentType } from "@remixicon/react";
import { RiInformationLine } from "@remixicon/react";
import { cn } from "@/lib/utils";
import { useValueDisplay } from "@/contexts/ValueDisplayContext";
import { fmtFull } from "@/utils/format";

interface KpiCardProps {
  title: string;
  value: string;
  rawValue?: number;
  subtitle?: string;
  tooltip?: string;
  icon?: RemixiconComponentType;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "primary" | "success" | "destructive";
}

const variantStyles = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-[var(--color-success)]",
  destructive: "text-destructive",
};

export function KpiCard({
  title,
  value,
  rawValue,
  subtitle,
  tooltip,
  trend,
  variant = "default",
}: KpiCardProps) {
  const { showFull } = useValueDisplay();
  const displayValue = showFull && rawValue != null ? fmtFull(rawValue) : value;
  const titleAttr = rawValue != null ? (showFull ? value : fmtFull(rawValue)) : value;
  const isLongValue = displayValue.length > 13;

  return (
    <div
      className="group relative flex flex-col justify-between rounded-lg bg-white dark:bg-[#283046] border border-slate-200/80 dark:border-white/[0.08] p-3 sm:px-4 sm:py-3 shadow-sm min-h-[80px] sm:min-h-[86px] transition-all duration-200 hover:border-slate-300 dark:hover:border-white/20"
      title={tooltip || title}
    >
      <div className="absolute top-2.5 right-3 sm:top-3 sm:right-4 pointer-events-none">
        <RiInformationLine
          className="size-3.5 sm:size-4 text-slate-400/80 group-hover:text-slate-600 dark:text-slate-400/80 dark:group-hover:text-slate-200 transition-colors"
          aria-hidden="true"
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200 pr-6 truncate">
          {title}
        </p>
        <p
          className={cn(
            "font-bold tabular-nums tracking-tight",
            isLongValue ? "text-base sm:text-lg" : "text-xl sm:text-2xl",
            variantStyles[variant],
          )}
          title={titleAttr}
        >
          {displayValue}
        </p>
      </div>

      <div className="h-4 flex items-center justify-between text-[11px] text-muted-foreground">
        {subtitle && <span className="truncate">{subtitle}</span>}
        {trend && (
          <span
            className={cn(
              "font-medium shrink-0",
              trend.positive ? "text-emerald-500" : "text-destructive",
            )}
          >
            {trend.positive ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
