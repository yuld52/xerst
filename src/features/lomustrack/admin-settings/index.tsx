import { useEffect, useState } from "react";
import { RiShieldStarLine } from "@remixicon/react";
import { StripeFeatureCard } from "@/features/lomustrack/advanced-settings/components/StripeFeatureCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/services/api";
import { toast } from "sonner";

const SETTINGS_KEY = "lomustrack-admin-global-settings-v1";

interface GlobalSettings {
  allowSignups: boolean;
  maintenanceMode: boolean;
  pushNotifications: boolean;
}

const DEFAULT_SETTINGS: GlobalSettings = {
  allowSignups: true,
  maintenanceMode: false,
  pushNotifications: true,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null") };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = (key: keyof GlobalSettings, value: boolean) =>
    setSettings((current) => ({ ...current, [key]: value }));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-brand/10 p-2.5">
          <RiShieldStarLine className="size-5 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações administrativas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie módulos disponíveis para toda a aplicação.
          </p>
        </div>
      </div>
      <div className="max-w-2xl">
        <StripeFeatureCard />
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Configurações globais do app</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <GlobalToggle
            id="allow-signups"
            label="Permitir novos cadastros"
            description="Controla se novos usuários podem criar contas."
            checked={settings.allowSignups}
            onChange={(value) => update("allowSignups", value)}
          />
          <GlobalToggle
            id="maintenance-mode"
            label="Modo de manutenção"
            description="Exibe manutenção para usuários comuns durante uma intervenção."
            checked={settings.maintenanceMode}
            onChange={(value) => update("maintenanceMode", value)}
          />
          <GlobalToggle
            id="global-push"
            label="Notificações push"
            description="Permite o envio global de notificações do sistema."
            checked={settings.pushNotifications}
            onChange={(value) => update("pushNotifications", value)}
          />
        </CardContent>
      </Card>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Segurança do painel</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={async () => {
            const setup = await apiRequest<{ secret: string }>("/profile/2fa/setup", { method: "POST" });
            const code = window.prompt(`Configure o autenticador com esta chave: ${setup.secret}\nDigite o código gerado para ativar:`);
            if (code) { await apiRequest(`/profile/2fa/enable?code=${encodeURIComponent(code)}`, { method: "POST" }); toast.success("Autenticação em dois fatores ativada."); }
          }}>Configurar 2FA</Button>
          <Button variant="outline" onClick={async () => { await apiRequest("/profile/sessions/revoke-all", { method: "POST" }); toast.success("Todas as sessões foram encerradas."); }}>Encerrar todas as sessões</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function GlobalToggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
      <div>
        <Label htmlFor={id} className="font-medium">
          {label}
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
