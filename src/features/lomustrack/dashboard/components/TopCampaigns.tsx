import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RiInformationLine } from "@remixicon/react";
import { cn } from "@/lib/utils";
import type { TopCampaign } from "@/types/dashboard";

import { convertAndFormatMZN } from "@/utils/format";

function fmt(v: number): string {
  return convertAndFormatMZN(v, 0);
}

interface TopCampaignsProps {
  data: TopCampaign[];
}

export function TopCampaigns({ data }: TopCampaignsProps) {
  if (data.length === 0) {
    return (
      <Card className="rounded-lg bg-white dark:bg-[#283046] border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
          Sem campanhas no período
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg bg-white dark:bg-[#283046] border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
      <CardHeader className="p-4 sm:p-5 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
            Top Campanhas
          </CardTitle>
          <span
            className="cursor-help text-slate-400/80 hover:text-slate-600 dark:text-slate-400/80 dark:hover:text-slate-200 transition-colors"
            title="Campanhas com melhor desempenho no período"
          >
            <RiInformationLine className="size-4 shrink-0" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 p-4 sm:p-5 pt-1">
        {data.slice(0, 3).map((campaign, index) => (
          <div
            key={campaign.name}
            className="group flex items-center justify-between rounded-lg border border-transparent p-2.5 transition-all duration-200 hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700/20"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                #{index + 1}
              </span>
              <div className="min-w-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-sm font-medium truncate max-w-[180px]">{campaign.name}</p>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[320px]">
                    <p className="text-xs">{campaign.name}</p>
                  </TooltipContent>
                </Tooltip>
                <p className="text-xs text-muted-foreground">
                  {campaign.sales} vendas
                  {campaign.spend > 0 ? ` · Invest. ${fmt(campaign.spend)}` : ""}
                  {campaign.cpa > 0 ? ` · CPA ${fmt(campaign.cpa)}` : ""}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="text-sm font-semibold tabular-nums">{fmt(campaign.revenue)}</p>
              <div className="flex items-center gap-2 justify-end">
                {campaign.profit !== 0 && (
                  <p
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      campaign.profit >= 0 ? "text-[var(--color-success)]" : "text-destructive",
                    )}
                  >
                    {campaign.profit >= 0 ? "+" : ""}
                    {fmt(campaign.profit)}
                  </p>
                )}
                {campaign.roas !== 0 && (
                  <p
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      campaign.roas >= 3
                        ? "text-[var(--color-success)]"
                        : campaign.roas >= 2
                          ? "text-[var(--color-warning)]"
                          : "text-destructive",
                    )}
                  >
                    {campaign.roas.toFixed(2)}x
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
