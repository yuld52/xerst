import { useState } from "react";
import { RefreshButton } from "@/components/RefreshButton";
import { NotificationBell } from "@/components/NotificationBell";
import { RiTrophyLine, RiInformationLine, RiCheckLine, RiLockLine } from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { convertAndFormatMZN } from "@/utils/format";

interface DashboardHeaderProps {
  onRefresh: () => Promise<void>;
  currentRevenue?: number; // Faturamento atual em reais
}

export function DashboardHeader({ onRefresh, currentRevenue = 0 }: DashboardHeaderProps) {
  const [showPrizesDialog, setShowPrizesDialog] = useState(false);
  
  // Calcular progresso dos prêmios
  // Backend armazena em BRL, convertemos para MZN (1 BRL = 13 MZN)
  const BRL_TO_MZN = 13;
  const prizeMilestonesMZN = [10_000, 100_000, 1_000_000, 5_000_000, 10_000_000];

  const currentRevenueValue = currentRevenue || 0;
  const currentRevenueMZN = currentRevenueValue * BRL_TO_MZN;
  const prizeGoalMZN =
    prizeMilestonesMZN.find((milestone) => currentRevenueMZN < milestone) ??
    prizeMilestonesMZN[prizeMilestonesMZN.length - 1];
  const prizeGoalBRL = prizeGoalMZN / BRL_TO_MZN;
  const prizeProgress = Math.min((currentRevenueValue / prizeGoalBRL) * 100, 100);

  // Garantir que a barra tenha pelo menos 1% de largura se houver algum valor
  const displayProgress = currentRevenueValue > 0 && prizeProgress < 1 ? 1 : prizeProgress;

  // Formatar valores em Metical
  const formatPrize = (value: number) => {
    if (value >= 1_000_000) {
      const millions = value / 1_000_000;
      // Se for número inteiro, não mostrar decimal
      return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(0)}K`;
    }
    return value.toFixed(0);
  };

  const prizeLevels = [
    { name: "Nível 1", goal: 10_000, reward: "Troféu Bronze", icon: "🥉" },
    { name: "Nível 2", goal: 100_000, reward: "Troféu Prata", icon: "🥈" },
    { name: "Nível 3", goal: 1_000_000, reward: "Troféu Ouro", icon: "🥇" },
    { name: "Nível 4", goal: 5_000_000, reward: "Troféu Platina", icon: "💎" },
    { name: "Nível 5", goal: 10_000_000, reward: "Troféu Diamante", icon: "👑" },
  ];

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard - Principal</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Visão geral do desempenho</p>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <RefreshButton onRefresh={onRefresh} />

        {/* Prêmios com barra de progresso */}
        <button
          onClick={() => setShowPrizesDialog(true)}
          className="hidden sm:flex flex-col mx-1 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="flex flex-row items-center">
            <div className="mr-1 text-primary">
              <RiTrophyLine className="size-5" strokeWidth={2.15} />
            </div>
            <span className="mr-6">
              <span
                className="font-semibold text-primary"
                title="Clique para ver os níveis"
              >
                Prêmios
              </span>
              <span className="ml-1" title={`${prizeProgress.toFixed(2)}% da meta atingido`}>
                <RiInformationLine
                  className="inline size-[15px] mb-[2px] cursor-help"
                  strokeWidth={2.75}
                  aria-label="Informações sobre as metas de prêmios"
                />
              </span>
            </span>
            <span className="space-x-1">
              <span className="font-bold">{formatPrize(currentRevenueMZN)}</span>
              <span className="font-bold">/</span>
              <span className="font-bold">{formatPrize(prizeGoalMZN)}</span>
            </span>
          </div>
          <div
            className="w-full mt-2 h-2 bg-muted rounded-full overflow-hidden"
            title={`Progresso: ${prizeProgress.toFixed(1)}%`}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{
                width: `${displayProgress}%`,
                background:
                  displayProgress > 0
                    ? "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)"
                    : "transparent",
                minWidth: displayProgress > 0 ? "4px" : "0",
              }}
            />
          </div>
        </button>
      </div>

      {/* Dialog de Níveis de Prêmios */}
      <Dialog open={showPrizesDialog} onOpenChange={setShowPrizesDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RiTrophyLine className="size-5 text-primary" />
              Níveis de Prêmios
            </DialogTitle>
            <DialogDescription>
              Alcance as metas de faturamento e desbloqueie prêmios exclusivos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {prizeLevels.map((level, index) => {
              const isUnlocked = currentRevenueMZN >= level.goal;
              const isCurrent = !isUnlocked && (index === 0 || currentRevenueMZN >= prizeLevels[index - 1].goal);
              const progress = isCurrent ? Math.min((currentRevenueMZN / level.goal) * 100, 100) : 0;
              
              return (
                <div
                  key={level.name}
                  className={`relative rounded-lg border p-4 transition-all ${
                    isUnlocked
                      ? "border-primary/50 bg-primary/5"
                      : isCurrent
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{level.icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{level.name}</p>
                        <p className="text-xs text-muted-foreground">{level.reward}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-sm font-bold">{convertAndFormatMZN(level.goal, 0)}</p>
                      {isUnlocked ? (
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <RiCheckLine className="size-4" />
                          <span>Desbloqueado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <RiLockLine className="size-3" />
                          <span>Bloqueado</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isCurrent && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Progresso</span>
                        <span className="text-xs font-semibold">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Faturamento atual: <span className="font-semibold text-foreground">{convertAndFormatMZN(currentRevenueMZN, 0)}</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
