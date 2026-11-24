import { useState } from "react";
import { RefreshButton } from "@/components/RefreshButton";
import { NotificationBell } from "@/components/NotificationBell";
import {
  RiTrophyLine,
  RiInformationLine,
  RiCheckLine,
  RiLockLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatMZN } from "@/utils/format";

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
      return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(0)}K`;
    }
    return value.toFixed(0);
  };

  const prizeLevels = [
    { name: "Nível 1", level: 1, goal: 10_000, reward: "Troféu Bronze", icon: "🥉", color: "from-amber-600 to-amber-800" },
    { name: "Nível 2", level: 2, goal: 100_000, reward: "Troféu Prata", icon: "🥈", color: "from-slate-400 to-slate-600" },
    { name: "Nível 3", level: 3, goal: 1_000_000, reward: "Troféu Ouro", icon: "🥇", color: "from-yellow-400 to-amber-600" },
    { name: "Nível 4", level: 4, goal: 5_000_000, reward: "Troféu Platina", icon: "💎", color: "from-cyan-400 to-blue-600" },
    { name: "Nível 5", level: 5, goal: 10_000_000, reward: "Troféu Diamante", icon: "👑", color: "from-purple-500 to-pink-600" },
  ];

  const currentLevel = prizeLevels[currentLevelIndex];
  const isUnlocked = currentRevenueMZN >= currentLevel.goal;
  const isCurrent = !isUnlocked && (currentLevelIndex === 0 || currentRevenueMZN >= prizeLevels[currentLevelIndex - 1].goal);
  const progress = isCurrent ? Math.min((currentRevenueMZN / currentLevel.goal) * 100, 100) : 0;
  const unlockedCount = prizeLevels.filter((lvl) => currentRevenueMZN >= lvl.goal).length;

  const handleOpenDialog = () => {
    // Abrir diretamente no nível atual em andamento (ou no último se todos conquistados)
    const activeIdx = prizeLevels.findIndex((lvl) => currentRevenueMZN < lvl.goal);
    setCurrentLevelIndex(activeIdx === -1 ? prizeLevels.length - 1 : activeIdx);
    setShowPrizesDialog(true);
  };

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
          onClick={handleOpenDialog}
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
        <DialogContent className="w-[94vw] max-w-sm sm:max-w-md p-0 overflow-hidden border border-border/60 shadow-2xl bg-card">
          {/* Cabeçalho */}
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40 bg-muted/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <RiTrophyLine className="size-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-base font-bold tracking-tight">Prêmios & Conquistas</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Acompanhe suas metas de faturamento e conquiste troféus
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Seletor Rápido de Níveis (Tabs / Stepper) */}
          <div className="px-5 pt-3 pb-1">
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-muted/30 rounded-xl border border-border/30">
              {prizeLevels.map((lvl, index) => {
                const isLvlUnlocked = currentRevenueMZN >= lvl.goal;
                const isLvlCurrent =
                  !isLvlUnlocked &&
                  (index === 0 || currentRevenueMZN >= prizeLevels[index - 1].goal);
                const isSelected = index === currentLevelIndex;

                return (
                  <button
                    key={lvl.name}
                    type="button"
                    onClick={() => setCurrentLevelIndex(index)}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all text-center relative ${
                      isSelected
                        ? "bg-background text-foreground shadow-sm ring-2 ring-primary/40 font-semibold"
                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    }`}
                  >
                    <span className="text-base leading-none mb-1">{lvl.icon}</span>
                    <span className="text-[10px] font-medium leading-tight">Nv {index + 1}</span>
                    {isLvlUnlocked && (
                      <span className="absolute -top-1 -right-1 size-3.5 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm">
                        <RiCheckLine className="size-2.5" strokeWidth={3} />
                      </span>
                    )}
                    {isLvlCurrent && !isLvlUnlocked && (
                      <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card Central do Nível Selecionado */}
          <div className="px-5 py-3">
            <div className="rounded-2xl border border-border/50 bg-gradient-to-b from-muted/20 to-muted/5 p-5 flex flex-col items-center text-center">
              {/* Ícone / Troféu com badge de status */}
              <div className="relative mb-3">
                <div
                  className={`flex items-center justify-center size-20 sm:size-24 rounded-full bg-gradient-to-br ${currentLevel.color} shadow-xl ring-4 ring-background/90`}
                >
                  <span className="text-4xl sm:text-5xl drop-shadow select-none">{currentLevel.icon}</span>
                </div>
                {isUnlocked && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1.5 shadow-md ring-2 ring-background">
                    <RiCheckLine className="size-3.5 sm:size-4" strokeWidth={3} />
                  </div>
                )}
                {!isUnlocked && !isCurrent && (
                  <div className="absolute -bottom-1 -right-1 bg-muted-foreground/30 text-muted-foreground rounded-full p-1.5 shadow-md ring-2 ring-background backdrop-blur-sm">
                    <RiLockLine className="size-3.5 sm:size-4" />
                  </div>
                )}
              </div>

              {/* Informações do Nível */}
              <div className="mb-2">
                <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground mb-1 uppercase tracking-wider">
                  {currentLevel.name}
                </span>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {currentLevel.reward}
                </h3>
              </div>

              {/* Meta */}
              <div className="mb-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block mb-0.5">
                  Meta
                </span>
                <span className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                  {formatMZN(currentLevel.goal, 0)}
                </span>
              </div>

              {/* Status do Nível */}
              <div className="w-full">
                {isUnlocked ? (
                  <div className="w-full py-2.5 px-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-green-600 dark:text-green-400 font-bold text-xs mb-0.5">
                      <RiCheckLine className="size-4" strokeWidth={2.5} />
                      <span>Conquistado</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Parabéns! Meta alcançada com sucesso.
                    </p>
                  </div>
                ) : isCurrent ? (
                  <div className="w-full p-3 rounded-xl bg-muted/40 border border-border/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-primary flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-primary animate-ping" />
                        Meta Atual
                      </span>
                      <span className="font-bold text-foreground">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${currentLevel.color} transition-all duration-500`}
                        style={{ width: `${Math.max(progress, 2)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/30 text-muted-foreground">
                      <span>Falta para atingir:</span>
                      <span className="font-bold text-foreground">
                        {formatMZN(Math.max(0, currentLevel.goal - currentRevenueMZN), 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full py-2.5 px-3 rounded-xl bg-muted/30 border border-border/40 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground font-semibold text-xs mb-0.5">
                      <RiLockLine className="size-3.5" />
                      <span>Bloqueado</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Complete os níveis anteriores para desbloquear
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navegação Horizontal & Indicadores */}
          <div className="px-5 pb-3 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevLevel}
              disabled={currentLevelIndex === 0}
              className="h-8 gap-1 text-xs px-2.5"
            >
              <RiArrowLeftSLine className="size-4" />
              Anterior
            </Button>

            {/* Dots Horizontais */}
            <div className="flex items-center justify-center gap-1.5">
              {prizeLevels.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentLevelIndex(index)}
                  className={`rounded-full transition-all ${
                    index === currentLevelIndex
                      ? "bg-primary w-5 h-1.5"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-1.5 h-1.5"
                  }`}
                  aria-label={`Ir para nível ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextLevel}
              disabled={currentLevelIndex === prizeLevels.length - 1}
              className="h-8 gap-1 text-xs px-2.5"
            >
              Próximo
              <RiArrowRightSLine className="size-4" />
            </Button>
          </div>

          {/* Rodapé com Faturamento Total */}
          <div className="px-5 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-between text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Seu Faturamento
              </span>
              <span className="text-sm font-bold text-foreground">
                {formatMZN(currentRevenueMZN, 0)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Progresso Geral
              </span>
              <span className="text-xs font-semibold text-primary">
                {unlockedCount} de {prizeLevels.length} desbloqueados
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
