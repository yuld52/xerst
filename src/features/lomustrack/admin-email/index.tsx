import { useState } from "react";
import { RiMailSendLine, RiNotification3Line } from "@remixicon/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendAdminEmail } from "@/services/auth";
import { apiRequest } from "@/services/api";
import { toast } from "sonner";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export default function AdminEmailPage() {
  // Email state
  const [emailForm, setEmailForm] = useState({
    email: "",
    subject: "",
    message: "",
    cta_text: "",
    cta_url: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  // Push state
  const [pushForm, setPushForm] = useState<PushPayload>({
    title: "",
    body: "",
    url: "",
  });
  const [sendingPush, setSendingPush] = useState(false);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEmail(true);
    try {
      await sendAdminEmail({
        email: emailForm.email,
        subject: emailForm.subject,
        message: emailForm.message,
        cta_text: emailForm.cta_text || undefined,
        cta_url: emailForm.cta_url || undefined,
      });
      toast.success("Email enviado com sucesso!");
      setEmailForm({ email: "", subject: "", message: "", cta_text: "", cta_url: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingPush(true);
    try {
      await apiRequest("/superadmin/push-notification", {
        method: "POST",
        body: {
          title: pushForm.title,
          body: pushForm.body,
          url: pushForm.url || undefined,
        },
      });
      toast.success("Notificação push enviada para todos os usuários!");
      setPushForm({ title: "", body: "", url: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar notificação push.");
    } finally {
      setSendingPush(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-brand/10 p-2.5">
          <RiMailSendLine className="size-5 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comunicações</h1>
          <p className="text-sm text-muted-foreground">
            Envie emails e notificações push para os usuários.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RiMailSendLine className="size-4 text-brand" />
              <CardTitle>Enviar Email</CardTitle>
            </div>
            <CardDescription>
              Envie um email personalizado para qualquer usuário ou endereço.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email-to">Destinatário</Label>
                <Input
                  id="email-to"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  disabled={sendingEmail}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email-subject">Assunto</Label>
                <Input
                  id="email-subject"
                  placeholder="Assunto do email"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm((f) => ({ ...f, subject: e.target.value }))}
                  required
                  disabled={sendingEmail}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email-message">Mensagem</Label>
                <Textarea
                  id="email-message"
                  placeholder="Conteúdo do email..."
                  rows={5}
                  value={emailForm.message}
                  onChange={(e) => setEmailForm((f) => ({ ...f, message: e.target.value }))}
                  required
                  disabled={sendingEmail}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email-cta-text">Texto do botão (opcional)</Label>
                  <Input
                    id="email-cta-text"
                    placeholder="Acessar agora"
                    value={emailForm.cta_text}
                    onChange={(e) => setEmailForm((f) => ({ ...f, cta_text: e.target.value }))}
                    disabled={sendingEmail}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email-cta-url">URL do botão (opcional)</Label>
                  <Input
                    id="email-cta-url"
                    placeholder="https://..."
                    value={emailForm.cta_url}
                    onChange={(e) => setEmailForm((f) => ({ ...f, cta_url: e.target.value }))}
                    disabled={sendingEmail}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={sendingEmail}>
                {sendingEmail ? "Enviando..." : "Enviar Email"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Push Notification */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RiNotification3Line className="size-4 text-brand" />
              <CardTitle>Notificação Push</CardTitle>
            </div>
            <CardDescription>
              Envie uma notificação push para todos os usuários que aceitaram receber alertas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendPush} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="push-title">Título</Label>
                <Input
                  id="push-title"
                  placeholder="Ex: Nova atualização disponível"
                  value={pushForm.title}
                  onChange={(e) => setPushForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  disabled={sendingPush}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="push-body">Mensagem</Label>
                <Textarea
                  id="push-body"
                  placeholder="Texto da notificação..."
                  rows={4}
                  value={pushForm.body}
                  onChange={(e) => setPushForm((f) => ({ ...f, body: e.target.value }))}
                  required
                  disabled={sendingPush}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="push-url">URL ao clicar (opcional)</Label>
                <Input
                  id="push-url"
                  placeholder="https://..."
                  value={pushForm.url}
                  onChange={(e) => setPushForm((f) => ({ ...f, url: e.target.value }))}
                  disabled={sendingPush}
                />
              </div>

              <Button type="submit" className="w-full" disabled={sendingPush}>
                {sendingPush ? "Enviando..." : "Enviar para Todos os Usuários"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
