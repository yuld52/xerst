import { useEffect, useState } from "react";
import { RiShieldStarLine } from "@remixicon/react";
import { StripeFeatureCard } from "@/features/lomustrack/advanced-settings/components/StripeFeatureCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/services/api";
import { toast } from "sonner";

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

type AuthSession = { id: string; device: string; ip_address: string | null; last_seen_at: string | null };

export default function AdminSettingsPage() {
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    apiRequest<GlobalSettings>("/superadmin/settings")
      .then(setSettings)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Não foi possível carregar as configurações globais."))
      .finally(() => setSettingsLoaded(true));
  }, []);

  useEffect(() => {
    apiRequest<AuthSession[]>("/profile/sessions").then(setSessions).catch(() => setSessions([]));
    apiRequest<{ two_factor_enabled: boolean }>("/profile").then((profile) => setTwoFactorEnabled(profile.two_factor_enabled)).catch(() => setTwoFactorEnabled(false));
  }, []);

  const update = async (key: keyof GlobalSettings, value: boolean) => {
    const previous = settings;
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSettingsSaving(true);
    try {
      setSettings(await apiRequest<GlobalSettings>("/superadmin/settings", { method: "PUT", body: next }));
      toast.success("Configuração global salva no Supabase.");
    } catch (error) {
      setSettings(previous);
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a configuração.");
    } finally {
      setSettingsSaving(false);
    }
  };

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
            disabled={!settingsLoaded || settingsSaving}
            onChange={(value) => void update("allowSignups", value)}
          />
          <GlobalToggle
            id="maintenance-mode"
            label="Modo de manutenção"
            description="Exibe manutenção para usuários comuns durante uma intervenção."
            checked={settings.maintenanceMode}
            disabled={!settingsLoaded || settingsSaving}
            onChange={(value) => void update("maintenanceMode", value)}
          />
          <GlobalToggle
            id="global-push"
            label="Notificações push"
            description="Permite o envio global de notificações do sistema."
            checked={settings.pushNotifications}
            disabled={!settingsLoaded || settingsSaving}
            onChange={(value) => void update("pushNotifications", value)}
          />
        </CardContent>
      </Card>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Segurança do painel</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={async () => {
            const setup = await apiRequest<{ secret: string }>("/profile/2fa/setup", { method: "POST" });
            const code = window.prompt(`Configure o autenticador com esta chave: ${setup.secret}\nDigite o código gerado para ativar:`);
            if (code) { await apiRequest(`/profile/2fa/enable?code=${encodeURIComponent(code)}`, { method: "POST" }); setTwoFactorEnabled(true); toast.success("Autenticação em dois fatores ativada."); }
          }}>Configurar 2FA</Button>
          {twoFactorEnabled && <Button variant="outline" onClick={async () => { const code = window.prompt("Digite o código atual do autenticador para desativar o 2FA:"); if (!code) return; await apiRequest(`/profile/2fa/disable?code=${encodeURIComponent(code)}`, { method: "POST" }); setTwoFactorEnabled(false); toast.success("Autenticação em dois fatores desativada."); }}>Desativar 2FA</Button>}
          <Button variant="outline" onClick={async () => { await apiRequest("/profile/sessions/revoke-all", { method: "POST" }); toast.success("Todas as sessões foram encerradas."); }}>Encerrar todas as sessões</Button>
          <p className="w-full text-xs text-muted-foreground">Autenticação em dois fatores: {twoFactorEnabled ? "Ativada" : "Desativada"}</p>
          <div className="w-full space-y-2 pt-3">
            <h3 className="text-sm font-medium">Sessões ativas</h3>
            {sessions.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma sessão ativa registrada além das sessões anteriores à atualização.</p> : sessions.map((session) => <div key={session.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-xs"><span className="min-w-0 break-all">{session.device}<span className="block text-muted-foreground">IP {session.ip_address || "desconhecido"} · atividade {session.last_seen_at ? new Date(session.last_seen_at).toLocaleString() : "—"}</span></span><Button size="sm" variant="outline" onClick={async () => { await apiRequest(`/profile/sessions/${session.id}`, { method: "DELETE" }); setSessions((current) => current.filter((item) => item.id !== session.id)); toast.success("Sessão encerrada."); }}>Encerrar</Button></div>)}
          </div>
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
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
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
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
