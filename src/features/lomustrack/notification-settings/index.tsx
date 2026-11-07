import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@/lib/import-navigation";
import {
  RiArrowLeftLine,
  RiInformationLine,
  RiNotification3Line,
  RiTimeLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  type NotificationPreferences,
  type NotificationTemplate,
  type Visibility,
  readNotificationPreferences,
  writeNotificationPreferences,
} from "@/lib/notificationPreferences";
import { getCreativeReportMessage } from "@/lib/creativeReportMessages";
import { fetchNotificationPreferences, updateNotificationPreferences } from "@/services/company";
import { isImportDemo } from "@/lib/import-demo";

function VisibilitySelect({
  id,
  label,
  value,
  onChange,
  enableMode = false,
}: {
  id: string;
  label: string;
  value: Visibility;
  onChange: (value: Visibility) => void;
  enableMode?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="flex items-center gap-1 text-sm text-muted-foreground"
        title={
          enableMode
            ? "Escolha se esse tipo de notificação será enviado."
            : "Escolha se essa informação aparecerá no relatório."
        }
      >
        {label}
        <RiInformationLine
          className="size-3.5 cursor-help"
          aria-label={`Informações sobre ${label}`}
        />
      </Label>
      <Select value={value} onValueChange={(next) => onChange(next as Visibility)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hide">{enableMode ? "Desabilitado" : "Esconder"}</SelectItem>
          <SelectItem value="show">{enableMode ? "Habilitado" : "Mostrar"}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function TemplateOption({
  value,
  selected,
  children,
  onSelect,
}: {
  value: NotificationTemplate;
  selected: boolean;
  children: string;
  onSelect: (value: NotificationTemplate) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(value)}
      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/50"
      }`}
    >
      <span
        className={`size-4 rounded-full border ${
          selected
            ? "border-primary bg-primary ring-2 ring-primary/20"
            : "border-muted-foreground/60"
        }`}
      />
      {children}
    </button>
  );
}

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    () => ({ ...readNotificationPreferences(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Maputo" }),
  );
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const demo = isImportDemo();
  const [creativePreview, setCreativePreview] = useState(() =>
    getCreativeReportMessage({ profit: 8250, roi: 66.3 }),
  );

  useEffect(() => {
    let mounted = true;
    if (demo) {
      setPreferencesLoaded(true);
      return () => { mounted = false; };
    }
    fetchNotificationPreferences()
      .then((saved) => { if (mounted) setPreferences({ ...saved, timezone: saved.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Maputo" }); })
      .catch((error) => {
        if (mounted) toast.error(error instanceof Error ? error.message : "Não foi possível carregar as preferências.");
      })
      .finally(() => { if (mounted) setPreferencesLoaded(true); });
    return () => { mounted = false; };
  }, [demo]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    writeNotificationPreferences(preferences);
    if (demo) return;
    const timer = window.setTimeout(() => {
      updateNotificationPreferences(preferences).catch((error) => {
        toast.error(error instanceof Error ? error.message : "Não foi possível salvar as preferências.");
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [preferences, preferencesLoaded, demo]);

  useEffect(() => {
    if (preferences.template === "creative") {
      setCreativePreview(getCreativeReportMessage({ profit: 8250, roi: 66.3 }));
    }
  }, [preferences.template]);

  const update = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ) => setPreferences((current) => ({ ...current, [key]: value }));

  const hasReportSchedule = Object.values(preferences.reportHours).some(Boolean);
  const reportPreview =
    preferences.template === "profit"
      ? "Seu resumo de lucro de hoje está pronto!\nFaturamento Líquido: MT 0,00\nGastos com Anúncios: MT 0,00\nROAS: 0,00\nLucro Líquido: MT 0,00"
      : preferences.template === "summary"
        ? "RESUMO DETALHADO DA OPERAÇÃO\n\nFaturamento Líquido: MT 0,00\n(Já descontadas as taxas de checkout)\nGasto com Anúncios: MT 0,00\n(Meta Ads)\nROI Geral: 0,00\nROAS Médio: 0,00\n\nCampanha com melhor performance: sem dados - ROI: 0,00\nAlerta: nenhuma campanha abaixo do esperado."
        : `Notificações Criativas\n${creativePreview}`;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/advanced-settings")}
          aria-label="Voltar"
        >
          <RiArrowLeftLine className="size-5" />
        </Button>
        <div className="rounded-lg bg-primary/10 p-2.5">
          <RiNotification3Line className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações de notificações</h1>
          <p className="text-sm text-muted-foreground">
            Defina quais alertas e relatórios você deseja receber.
          </p>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Notificações de Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            <p className="text-sm text-muted-foreground">
              Seja notificado no app sempre que for realizada uma nova venda.
            </p>
            <div className="space-y-4">
              <h2 className="font-semibold text-muted-foreground">Opções</h2>
              <VisibilitySelect
                id="pending-sales"
                label="Enviar vendas pendentes"
                value={preferences.pendingSales}
                onChange={(value) => update("pendingSales", value)}
                enableMode
              />
              <VisibilitySelect
                id="approved-sales"
                label="Enviar vendas aprovadas"
                value={preferences.approvedSales}
                onChange={(value) => update("approvedSales", value)}
                enableMode
              />
              <VisibilitySelect
                id="sale-value"
                label="Valor da venda"
                value={preferences.saleValue}
                onChange={(value) => update("saleValue", value)}
              />
              <VisibilitySelect
                id="product-name"
                label="Nome do produto"
                value={preferences.productName}
                onChange={(value) => update("productName", value)}
              />
              <VisibilitySelect
                id="campaign-value"
                label="Valor de utm_campaign"
                value={preferences.campaignValue}
                onChange={(value) => update("campaignValue", value)}
              />
            </div>
            <div className="space-y-2 border-t pt-5">
              <h2 className="font-semibold text-muted-foreground">Prévia de Notificação</h2>
              <p className="text-sm text-muted-foreground">
                {preferences.pendingSales === "hide" && preferences.approvedSales === "hide"
                  ? "Habilite o envio de vendas pendentes e/ou aprovadas para visualizar a prévia."
                  : preferences.approvedSales === "show"
                    ? "Venda aprovada!\nValor: MT 0,00"
                    : "Venda pendente!\nAguardando confirmação do pagamento."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Notificações de Relatório</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            <p className="text-sm text-muted-foreground">
              Configure as notificações de relatório que quer visualizar:
            </p>
            <div className="space-y-4">
              <h2 className="font-semibold text-muted-foreground">Horários</h2>
              <p className="text-xs text-muted-foreground">Fuso horário deste dispositivo: {preferences.timezone}</p>
              {Object.keys(preferences.reportHours).map((hour) => (
                <div key={hour} className="flex items-center justify-between gap-4">
                  <Label htmlFor={`report-${hour}`} className="text-sm text-muted-foreground">
                    Notificação das {hour}
                  </Label>
                  <Switch
                    id={`report-${hour}`}
                    checked={preferences.reportHours[hour]}
                    onCheckedChange={(checked) =>
                      setPreferences((current) => ({
                        ...current,
                        reportHours: { ...current.reportHours, [hour]: checked },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h2 className="font-semibold text-muted-foreground">Padrão de Notificação</h2>
              <TemplateOption
                value="profit"
                selected={preferences.template === "profit"}
                onSelect={(value) => update("template", value)}
              >
                Status de Lucro
              </TemplateOption>
              <TemplateOption
                value="summary"
                selected={preferences.template === "summary"}
                onSelect={(value) => update("template", value)}
              >
                Resumo Detalhado
              </TemplateOption>
              <TemplateOption
                value="creative"
                selected={preferences.template === "creative"}
                onSelect={(value) => update("template", value)}
              >
                Notificações Criativas
              </TemplateOption>
            </div>
            <div className="space-y-2 border-t pt-5">
              <h2 className="font-semibold text-muted-foreground">Prévia de Notificação</h2>
              {hasReportSchedule ? (
                <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <RiTimeLine className="mt-0.5 size-4 shrink-0" />
                    <span>
                      Relatório configurado para{" "}
                      {Object.entries(preferences.reportHours)
                        .filter(([, enabled]) => enabled)
                        .map(([hour]) => hour)
                        .join(", ")}
                      .
                    </span>
                  </div>
                  <p className="whitespace-pre-line border-t border-border/60 pt-2">
                    {reportPreview}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Habilite ao menos um horário de notificação para visualizar a prévia.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
