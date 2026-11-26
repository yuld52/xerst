import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/services/api";
import { RiMailSendLine } from "@remixicon/react";

interface EmailPayload {
  recipient_email?: string;
  send_to_all?: boolean;
  subject: string;
  message: string;
  cta_text?: string;
  cta_url?: string;
}

export function EmailSender() {
  const [sendToAll, setSendToAll] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    // Validation
    if (!subject.trim()) {
      toast.error("Por favor, informe o assunto do e-mail.");
      return;
    }
    if (!message.trim()) {
      toast.error("Por favor, informe a mensagem do e-mail.");
      return;
    }
    if (!sendToAll && !recipientEmail.trim()) {
      toast.error("Por favor, informe o e-mail do destinatário ou selecione enviar para todos.");
      return;
    }
    if ((ctaText.trim() && !ctaUrl.trim()) || (!ctaText.trim() && ctaUrl.trim())) {
      toast.error("Para adicionar um botão, preencha tanto o texto quanto a URL.");
      return;
    }

    setSending(true);
    try {
      const payload: EmailPayload = {
        subject: subject.trim(),
        message: message.trim(),
      };

      if (sendToAll) {
        payload.send_to_all = true;
      } else {
        payload.recipient_email = recipientEmail.trim();
      }

      if (ctaText.trim() && ctaUrl.trim()) {
        payload.cta_text = ctaText.trim();
        payload.cta_url = ctaUrl.trim();
      }

      await apiRequest("/superadmin/settings/send-email", {
        method: "POST",
        body: payload,
      });

      toast.success(
        sendToAll
          ? "E-mail enviado para todos os usuários com sucesso."
          : "E-mail enviado com sucesso.",
      );

      // Reset form
      setRecipientEmail("");
      setSubject("");
      setMessage("");
      setCtaText("");
      setCtaUrl("");
      setSendToAll(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o e-mail.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiMailSendLine className="size-5" />
          Enviar E-mail
        </CardTitle>
        <CardDescription>
          Envie e-mails para usuários individuais ou para todos os usuários da plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Send to all toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="send-to-all">Enviar para todos os usuários</Label>
            <p className="text-sm text-muted-foreground">
              Marque para enviar este e-mail para todos os usuários cadastrados
            </p>
          </div>
          <Switch
            id="send-to-all"
            checked={sendToAll}
            onCheckedChange={setSendToAll}
            disabled={sending}
          />
        </div>

        {/* Recipient email (only if not sending to all) */}
        {!sendToAll && (
          <div className="space-y-2">
            <Label htmlFor="recipient-email">E-mail do destinatário</Label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="usuario@exemplo.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              disabled={sending}
            />
          </div>
        )}

        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="email-subject">Assunto</Label>
          <Input
            id="email-subject"
            type="text"
            placeholder="Assunto do e-mail"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={sending}
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="email-message">Mensagem</Label>
          <Textarea
            id="email-message"
            placeholder="Digite a mensagem do e-mail..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            rows={6}
          />
        </div>

        {/* Optional CTA button */}
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Botão de ação (opcional)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cta-text">Texto do botão</Label>
              <Input
                id="cta-text"
                type="text"
                placeholder="Ver mais"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                disabled={sending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta-url">URL do botão</Label>
              <Input
                id="cta-url"
                type="url"
                placeholder="https://exemplo.com"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                disabled={sending}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Adicione um botão de chamada para ação no e-mail. Preencha ambos os campos ou deixe em
            branco.
          </p>
        </div>

        {/* Send button */}
        <Button onClick={handleSend} disabled={sending} className="w-full">
          <RiMailSendLine className="mr-2 size-4" />
          {sending ? "Enviando..." : "Enviar E-mail"}
        </Button>
      </CardContent>
    </Card>
  );
}
