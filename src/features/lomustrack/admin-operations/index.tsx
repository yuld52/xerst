import { useEffect, useState } from "react";
import { apiRequest } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiDownloadLine, RiRefreshLine, RiShieldCheckLine } from "@remixicon/react";

type Integration = { platform: string; connected: boolean; last_sync: string | null; error: string | null };
type Delivery = { id: number; platform: string; slug: string; status: string; error: string | null; attempts: number; received_at: string | null };
type Audit = { id: number; action: string; resource_type: string; created_at: string | null };
type Notification = { id: number; title: string; body: string; status: string; sent_count: number; failed_count: number; created_at: string | null };

export default function AdminOperationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { void load(); }, []);

  const retry = async (id: number) => {
    await apiRequest(`/webhooks/history/${id}/retry`, { method: "POST" });
    await load();
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operação e segurança</h1>
          <p className="text-sm text-muted-foreground">Integrações, webhooks, auditoria e exportações reais.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading} className="gap-2">
          <RiRefreshLine className="size-4" /> Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Monitoramento das plataformas</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {integrations.map((item) => (
            <div key={item.platform} className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{item.platform}</span>
                <Badge variant={item.connected ? "default" : "outline"}>{item.connected ? "Conectado" : "Pendente"}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{item.error || (item.last_sync ? `Último sync: ${item.last_sync}` : "Sem sincronização registrada")}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico de webhooks</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {deliveries.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum evento recebido ainda.</p> : deliveries.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <div><span className="font-medium">{item.platform}</span><span className="ml-2 text-muted-foreground">/{item.slug}</span><p className="text-xs text-muted-foreground">{item.error || `Tentativas: ${item.attempts}`}</p></div>
              <div className="flex items-center gap-2"><Badge variant={item.status === "processed" ? "default" : "outline"}>{item.status}</Badge>{item.status === "error" && <Button size="sm" variant="outline" onClick={() => void retry(item.id)}>Reprocessar</Button>}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Relatórios exportáveis</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[["sales", "Vendas"], ["customers", "Clientes"], ["profit", "Lucro"], ["subscriptions", "Assinaturas"], ["awards", "Prêmios"]].map(([kind, label]) => <Button key={kind} variant="outline" asChild><a href={`/api/admin/export/${kind}`}><RiDownloadLine className="mr-2 size-4" />{label} CSV</a></Button>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><RiShieldCheckLine className="size-5" />Auditoria administrativa</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {audit.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p> : audit.slice(0, 6).map((item) => <div key={item.id} className="flex justify-between gap-3 border-b py-2 text-sm"><span>{item.action}</span><span className="text-xs text-muted-foreground">{item.resource_type}</span></div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Histórico de notificações</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {notifications.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma notificação enviada ainda.</p> : notifications.map((item) => <div key={item.id} className="rounded-lg border p-3 text-sm"><div className="flex justify-between gap-2"><span className="font-medium">{item.title}</span><Badge variant="outline">{item.status}</Badge></div><p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{item.body}</p><p className="mt-1 text-xs text-muted-foreground">Enviadas: {item.sent_count} · Falhas: {item.failed_count}</p></div>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
