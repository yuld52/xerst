import { useState } from "react";
import { RefreshButton } from "@/components/RefreshButton";
import { NotificationBell } from "@/components/NotificationBell";
import { RiTrophyLine, RiInformationLine, RiCheckLine, RiLockLine, RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { convertAndFormatMZN } from "@/utils/format";

interface DashboardHeaderProps {
  onRefresh: () => Promise<void>;
  currentRevenue?: number; // Faturamento atual em reais
}

export function DashboardHeader({ onRefresh, currentRevenue = 0 }: DashboardHeaderProps) {
  const [showPrizesDialog, setShowPrizesDialog] = useState(false);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  
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
    { name: "Nível 1", goal: 10_000, reward: "Troféu Bronze", icon: "🥉", color: "from-amber-600 to-amber-800" },
    { name: "Nível 2", goal: 100_000, reward: "Troféu Prata", icon: "🥈", color: "from-gray-400 to-gray-600" },
    { name: "Nível 3", goal: 1_000_000, reward: "Troféu Ouro", icon: "🥇", color: "from-yellow-400 to-yellow-600" },
    { name: "Nível 4", goal: 5_000_000, reward: "Troféu Platina", icon: "💎", color: "from-cyan-400 to-blue-600" },
    { name: "Nível 5", goal: 10_000_000, reward: "Troféu Diamante", icon: "👑", color: "from-purple-500 to-pink-600" },
  ];

  const currentLevel = prizeLevels[currentLevelIndex];
  const isUnlocked = currentRevenueMZN >= currentLevel.goal;
  const isCurrent = !isUnlocked && (currentLevelIndex === 0 || currentRevenueMZN >= prizeLevels[currentLevelIndex - 1].goal);
  const progress = isCurrent ? Math.min((currentRevenueMZN / currentLevel.goal) * 100, 100) : 0;

  const handlePrevLevel = () => {
    setCurrentLevelIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextLevel = () => {
    setCurrentLevelIndex((prev) => Math.min(prizeLevels.length - 1, prev + 1));
  };

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

      {/* Dialog de Níveis de Prêmios - Carrossel Vertical */}
      <Dialog open={showPrizesDialog} onOpenChange={setShowPrizesDialog}>
        <DialogContent className="sm:max-w-[180px] p-0">
          <DialogHeader className="px-3 pt-4 pb-2">
            <DialogTitle className="flex items-center gap-1 justify-center text-xs">
              <RiTrophyLine className="size-3.5 text-primary" />
              Níveis de Prêmios
            </DialogTitle>
            <DialogDescription className="text-center text-[10px]">
              Alcance as metas
            </DialogDescription>
          </DialogHeader>
          
          {/* Carrossel de níveis */}
          <div className="relative px-3 pb-3">
            {/* Card do nível atual */}
            <div className="relative min-h-[580px] flex flex-col">
              {/* Troféu grande */}
              <div className={`relative mx-auto mb-6 flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${currentLevel.color} shadow-2xl`}>
                <span className="text-5xl">{currentLevel.icon}</span>
                {isUnlocked && (
                  <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 shadow-lg">
                    <RiCheckLine className="size-4 text-white" strokeWidth={3} />
                  </div>
                )}
                {!isUnlocked && !isCurrent && (
                  <div className="absolute -top-1 -right-1 bg-muted rounded-full p-1 shadow-lg border border-background">
                    <RiLockLine className="size-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Informações do nível */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold mb-1">{currentLevel.name}</h3>
                <p className="text-[10px] text-muted-foreground mb-3 px-1">{currentLevel.reward}</p>
                <p className="text-2xl font-bold text-primary mb-1 leading-tight break-all px-1">{convertAndFormatMZN(currentLevel.goal, 0)}</p>
                <p className="text-[9px] text-muted-foreground">Meta</p>
              </div>

              {/* Status */}
              <div className="text-center mb-6 px-2">
                {isUnlocked ? (
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                      <RiCheckLine className="size-3.5" />
                      <span className="font-semibold text-[10px]">Desbloqueado!</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Parabéns! 🎉
                    </p>
                  </div>
                ) : isCurrent ? (
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      <span className="font-semibold text-[10px]">Em progresso</span>
                    </div>
                    <div className="space-y-2 bg-muted/30 rounded-lg p-2.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-bold text-sm">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${currentLevel.color} transition-all duration-500 shadow-sm`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="pt-1 space-y-0.5">
                        <p className="text-[9px] text-muted-foreground">Falta:</p>
                        <p className="font-bold text-foreground text-[11px] break-all">{convertAndFormatMZN(currentLevel.goal - currentRevenueMZN, 0)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      <RiLockLine className="size-3" />
                      <span className="font-semibold text-[10px]">Bloqueado</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Complete anteriores
                    </p>
                  </div>
                )}
              </div>

              {/* Indicadores de posição */}
              <div className="flex items-center justify-center gap-1 mt-auto pt-4">
                {prizeLevels.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentLevelIndex(index)}
                    className={`h-1 rounded-full transition-all ${
                      index === currentLevelIndex
                        ? "bg-primary w-5"
                        : "bg-muted hover:bg-muted-foreground/50 w-1"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Botões de navegação */}
            <div className="absolute top-[150px] -left-4 -right-4 flex items-center justify-between pointer-events-none">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevLevel}
                disabled={currentLevelIndex === 0}
                className="pointer-events-auto rounded-full h-8 w-8 shadow-xl border-2"
              >
                <RiArrowLeftSLine className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextLevel}
                disabled={currentLevelIndex === prizeLevels.length - 1}
                className="pointer-events-auto rounded-full h-8 w-8 shadow-xl border-2"
              >
                <RiArrowRightSLine className="size-4" />
              </Button>
            </div>
          </div>
          
          {/* Rodapé */}
          <div className="text-center px-3 pb-4 pt-2 border-t bg-muted/20">
            <p className="text-[9px] text-muted-foreground mb-0.5">Faturamento Total</p>
            <p className="text-sm font-bold text-foreground break-all">{convertAndFormatMZN(currentRevenueMZN, 0)}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
