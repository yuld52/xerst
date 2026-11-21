import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Headphones,
  MessageCircle,
  Mail,
  Send,
  CheckCircle2,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
  userName?: string;
}

export function SupportModal({ open, onOpenChange, userEmail, userName }: SupportModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    // Simula envio de ticket de suporte
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    setSent(true);
    toast.success("Mensagem enviada para o suporte!");

    setTimeout(() => {
      setSent(false);
      setMessage("");
      setSubject("");
      onOpenChange(false);
    }, 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá! Preciso de suporte no LomusTrack.\nNome: ${userName || "Usuário"}\nE-mail: ${userEmail || ""}`,
    );
    window.open(`https://wa.me/5511999999999?text=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/60 shadow-2xl">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
              <Headphones className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Suporte LomusTrack</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Dúvidas, problemas técnicos ou sugestões? Estamos à disposição.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Canais de atendimento */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex flex-col items-start p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-left group"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <MessageCircle className="size-4 text-emerald-500" />
              <span className="text-[10px] font-medium bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded-full">
                Online
              </span>
            </div>
            <span className="text-xs font-semibold text-foreground group-hover:text-emerald-500 transition-colors">
              WhatsApp
            </span>
            <span className="text-[11px] text-muted-foreground">Atendimento direto</span>
          </button>

          <a
            href={`mailto:suporte@lomustrack.com?subject=Suporte LomusTrack - ${encodeURIComponent(userName || "Usuário")}`}
            className="flex flex-col items-start p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 transition-all text-left group"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <Mail className="size-4 text-blue-500" />
              <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="size-2.5" /> ~1h
              </span>
            </div>
            <span className="text-xs font-semibold text-foreground group-hover:text-blue-500 transition-colors">
              E-mail
            </span>
            <span className="text-[11px] text-muted-foreground truncate w-full">
              suporte@lomustrack.com
            </span>
          </a>
        </div>

        {/* Formulário de contato */}
        {sent ? (
          <div className="py-6 text-center space-y-2 animate-in fade-in">
            <div className="size-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-6" />
            </div>
            <p className="text-sm font-semibold">Mensagem enviada com sucesso!</p>
            <p className="text-xs text-muted-foreground">
              Responderemos em breve diretamente no seu e-mail cadastrado.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Assunto
              </label>
              <Input
                placeholder="Ex: Dúvida sobre métricas de vendas"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Como podemos ajudar?
              </label>
              <Textarea
                placeholder="Descreva detalhadamente o que precisa..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[85px] text-xs resize-none"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={sending || !message.trim()}
              className="w-full h-9 text-xs font-medium gap-2"
            >
              <Send className="size-3.5" />
              {sending ? "Enviando..." : "Enviar Mensagem"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
