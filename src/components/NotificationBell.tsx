import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BellIcon, BellAlertIcon } from "@heroicons/react/24/outline";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { permission, isSubscribed, isDemo, requestPermission, unsubscribe, testNotification } =
    usePushNotifications();

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    setLoading(true);
    try {
      if (enabled) {
        await requestPermission();
      } else {
        await unsubscribe();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await testNotification();
    } finally {
      setTesting(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("size-9 shrink-0 relative cursor-pointer", className)}
          title={isSubscribed ? "Notificações de vendas ativadas" : "Ativar notificações de vendas"}
          aria-label="Notificações"
        >
          {isSubscribed ? (
            <BellAlertIcon className="size-4 text-foreground" />
          ) : (
            <BellIcon className="size-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-4 shadow-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                {isSubscribed ? (
                  <BellAlertIcon className="size-4" />
                ) : (
                  <BellIcon className="size-4" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold leading-tight">Notificações de Vendas</h4>
                <p className="text-[11px] text-muted-foreground">Alertas em tempo real</p>
              </div>
            </div>

            <span
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full",
                isSubscribed
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {isSubscribed ? "Ativo" : "Inativo"}
            </span>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="topbar-push-toggle" className="text-xs font-medium cursor-pointer">
                  Notificações de vendas
                </Label>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Receba um aviso a cada nova venda
                </p>
              </div>
              <Switch
                id="topbar-push-toggle"
                checked={isSubscribed}
                onCheckedChange={handleToggle}
                disabled={loading || permission === "denied"}
              />
            </div>

            {permission === "denied" && (
              <div className="rounded bg-destructive/10 p-2 text-[11px] text-destructive leading-tight">
                ⚠️ Permissão bloqueada pelo navegador. Permita notificações nas configurações do
                site (no ícone de cadeado na barra de endereço).
              </div>
            )}

            {isDemo && (
              <p className="text-[11px] text-muted-foreground leading-tight">
                Modo demonstração: os avisos aparecem neste navegador.
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testing || permission === "denied"}
            className="w-full text-xs h-8"
          >
            {testing
              ? "Enviando teste..."
              : isSubscribed
                ? "🔔 Testar notificação de venda"
                : "🔔 Permitir e testar notificação"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
