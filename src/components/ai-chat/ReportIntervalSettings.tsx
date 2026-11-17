import { useEffect, useState } from "react";
import { RiSettings3Line } from "@remixicon/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { fetchUserPreferences, updateUserPreferences } from "@/services/userPreferences";
import { getCookie } from "@/lib/cookies";
import { isImportDemo } from "@/lib/import-demo";
import { toast } from "sonner";

const INTERVAL_KEY = "lomus-report-interval";
const DEFAULT_INTERVAL = 24 * 60;

export function getReportIntervalMs(): number {
  return DEFAULT_INTERVAL * 60 * 1000;
}

export function getReportIntervalMinutes(): number {
  return DEFAULT_INTERVAL;
}

interface ReportIntervalSettingsProps {
  onIntervalChange?: (minutes: number) => void;
}

export function ReportIntervalSettings({ onIntervalChange }: ReportIntervalSettingsProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getCookie("access_token") || isImportDemo()) return;
    fetchUserPreferences()
      .then((preferences) => {
        const saved = preferences.reportIntervalMinutes;
        if (saved !== DEFAULT_INTERVAL) {
          void updateUserPreferences({ reportIntervalMinutes: DEFAULT_INTERVAL }).catch(
            () => undefined,
          );
        }
        localStorage.setItem(INTERVAL_KEY, String(DEFAULT_INTERVAL));
        onIntervalChange?.(DEFAULT_INTERVAL);
      })
      .catch(() => undefined);
  }, [onIntervalChange]);

  const handleSave = async () => {
    const value = DEFAULT_INTERVAL;
    if (getCookie("access_token") && !isImportDemo()) {
      setSaving(true);
      try {
        await updateUserPreferences({ reportIntervalMinutes: value });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Não foi possível salvar o intervalo no banco.",
        );
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    localStorage.setItem(INTERVAL_KEY, String(value));
    onIntervalChange?.(value);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Configurações do relatório"
        >
          <RiSettings3Line className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[240px] p-4 space-y-3 z-[70]">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Relatório automático
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Frequência máxima no plano Hobby
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-interval" className="text-xs">
            Frequência
          </Label>
          <p id="report-interval" className="text-sm text-muted-foreground">
            Uma vez por dia
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => void handleSave()}
          disabled={saving}
          className="w-full h-8 text-xs"
        >
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
