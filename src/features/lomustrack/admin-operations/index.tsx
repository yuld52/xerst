import { useEffect, useState } from "react";
import { apiDownload, apiRequest } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RiDownloadLine, RiRefreshLine, RiShieldCheckLine, RiMailSendLine, RiCloseLine } from "@remixicon/react";

type Integration = {
  platform: string;
  connected: boolean;
  last_sync: string | null;
  error: string | null;
};
type Delivery = {
  id: number;
  platform: string;
  slug: string;
  status: string;
  error: string | null;
  attempts: number;
  received_at: string | null;
};
type Audit = {
  id: number;
  action: string;
  actor: string;
  resource_type: string;
  created_at: string | null;
};
type Notification = {
  id: number;
  title: string;
  body: string;
  status: string;
  sent_count: number;
  failed_count: number;
  created_at: string | null;
};

export default function AdminOperationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Email form state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [emailForm, setEmailForm] = useState({
    email: "",
    subject: "",
    message: "",
    cta_text: "",
    cta_url: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [nextIntegrations, nextDeliveries, nextAudit, nextNotifications] = await Promise.all([
        apiRequest<Integration[]>("/integrations/status"),
        apiRequest<Delivery[]>("/webhooks/history?limit=20"),
        apiRequest<Audit[]>("/audit/logs?limit=20"),
        apiRequest<Notification[]>("/notifications/history?limit=10"),
      ]);
      setIntegrations(nextIntegrations);
      setDeliveries(nextDeliveries);
      setAudit(nextAudit);
      setNotifications(nextNotifications);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const retry = async (id: number) => {
    await apiRequest(`/webhooks/history/${id}/retry`, { method: "POST" });
    await load();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    setEmailLoading(true);
    try {
      await apiRequest("/superadmin/settings/send-email", {
        method: "POST",
        body: emailForm,
      });
      setEmailSuccess("Email enviado com sucesso!");
      setEmailForm({ email: "", subject: "", message: "", cta_text: "", cta_url: "" });
      setShowEmailForm(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar email";
      setEmailError(msg);
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operação e segurança</h1>
          <p className="text-sm text-muted-foreground">
            Integrações, webhooks, auditoria e exportações reais.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEmailForm(true)} className="gap-2">
            <RiMailSendLine className="size-4" /> Enviar email
          </Button>
          <Button variant="outline" onClick={() => void load()} disabled={loading} className="gap-2">
            <RiRefreshLine className="size-4" /> Atualizar
          </Button>
        </div>
      </div>

      {showEmailForm && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Enviar email informativo</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowEmailForm(false)}>
              <RiCloseLine className="size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4 max-w-2xl">
              {emailError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{emailError}</div>
              )}
              {emailSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">{emailSuccess}</div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Email destinatário</label>
                <Input
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Assunto</label>
                <Input
                  placeholder="Assunto do email"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Mensagem (suporta quebras de linha)</label>
                <Textarea
                  placeholder="Digite sua mensagem aqui..."
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  rows={6}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Texto do botão (opcional)</label>
                  <Input
                    placeholder="Ex: Acessar dashboard"
                    value={emailForm.cta_text}
                    onChange={(e) => setEmailForm({ ...emailForm, cta_text: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-muted-foreground">URL do botão (opcional)</label>
                  <Input
                    placeholder="https://lomustrack.online/dashboard"
                    value={emailForm.cta_url}
                    onChange={(e) => setEmailForm({ ...emailForm, cta_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={emailLoading} className="gap-2">
                  <RiMailSendLine className="size-4" />
                  {emailLoading ? "Enviando..." : "Enviar email"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowEmailForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Monitoramento das plataformas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {integrations.map((item) => (
            <div key={item.platform} className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{item.platform}</span>
                <Badge variant={item.connected ? "default" : "outline"}>
                  {item.connected ? "Conectado" : "Pendente"}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {item.error ||
                  (item.last_sync
                    ? `Último sync: ${item.last_sync}`
                    : "Sem sincronização registrada")}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de webhooks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {deliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento recebido ainda.</p>
          ) : (
            deliveries.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
              >
                <div>
                  <span className="font-medium">{item.platform}</span>
                  <span className="ml-2 text-muted-foreground">/{item.slug}</span>
                  <p className="text-xs text-muted-foreground">
                    {item.error || `Tentativas: ${item.attempts}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.status === "processed" ? "default" : "outline"}>
                    {item.status}
                  </Badge>
                  {item.status === "error" && (
                    <Button size="sm" variant="outline" onClick={() => void retry(item.id)}>
                      Reprocessar
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Relatórios exportáveis</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[
              ["sales", "Vendas"],
              ["customers", "Clientes"],
              ["profit", "Lucro"],
              ["subscriptions", "Assinaturas"],
              ["awards", "Prêmios"],
            ].map(([kind, label]) => (
              <Button
                key={kind}
                variant="outline"
                onClick={() =>
                  void apiDownload(`/admin/export/${kind}`, `lomus-${kind}.csv`).catch((error) =>
                    window.alert(error.message),
                  )
                }
              >
                <RiDownloadLine className="mr-2 size-4" />
                {label} CSV
              </Button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiShieldCheckLine className="size-5" />
              Auditoria administrativa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {audit.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>
            ) : (
              audit.slice(0, 6).map((item) => (
                <div key={item.id} className="flex justify-between gap-3 border-b py-2 text-sm">
                  <span>
                    {item.action}
                    <span className="block text-xs text-muted-foreground">Por {item.actor}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{item.resource_type}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Histórico de notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma notificação enviada ainda.</p>
            ) : (
              notifications.map((item) => (
                <div key={item.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{item.title}</span>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
                    {item.body}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enviadas: {item.sent_count} · Falhas: {item.failed_count}
                  </p>
                  {["failed", "partial", "retry_pending", "no_subscribers"].includes(
                    item.status,
                  ) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() =>
                        void apiRequest(`/notifications/history/${item.id}/retry`, {
                          method: "POST",
                        })
                          .then(load)
                          .catch((error) => window.alert(error.message))
                      }
                    >
                      Tentar enviar novamente
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
