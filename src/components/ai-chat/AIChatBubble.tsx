import { useState, useRef, useEffect, useCallback } from "react";
import { RiMessageAi3Line, RiCloseLine, RiDeleteBinLine } from "@remixicon/react";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { PageDataToggle } from "./PageDataToggle";
import { ReportIntervalSettings } from "./ReportIntervalSettings";
import { geminiChat, executeAiAction, type AiAction } from "@/services/integrations";
import { usePageDataValue } from "@/contexts/PageDataContext";
import { fetchUserPreferences, updateUserPreferences } from "@/services/userPreferences";
import { getCookie } from "@/lib/cookies";
import { isImportDemo } from "@/lib/import-demo";

const STORAGE_KEY = "lomus-ai-chat";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIChatBubbleProps {
  dailyReport?: string | null;
  dailyReportLoading?: boolean;
  shouldAutoOpen?: boolean;
  onAutoOpened?: () => void;
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export function AIChatBubble({
  dailyReport,
  dailyReportLoading,
  shouldAutoOpen,
  onAutoOpened,
}: AIChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [usePageContext, setUsePageContext] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const snapshot = usePageDataValue();
  const hasInjectedReport = useRef(false);
  const [preferencesReady, setPreferencesReady] = useState(false);

  useEffect(() => {
    saveMessages(messages);
    if (!preferencesReady || isImportDemo() || !getCookie("access_token")) return;
    const timer = window.setTimeout(() => {
      void updateUserPreferences({ chatHistory: messages.slice(-60) }).catch(() => undefined);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [messages, preferencesReady]);

  useEffect(() => {
    if (!getCookie("access_token") || isImportDemo()) {
      setPreferencesReady(true);
      return;
    }
    let active = true;
    fetchUserPreferences()
      .then((preferences) => {
        const history = preferences.chatHistory;
        if (active && Array.isArray(history)) {
          const valid = history.filter((message): message is ChatMessage =>
            !!message && typeof message === "object" &&
            ((message as ChatMessage).role === "user" || (message as ChatMessage).role === "assistant") &&
            typeof (message as ChatMessage).content === "string",
          ).slice(-60);
          if (valid.length) {
            setMessages(valid);
            saveMessages(valid);
          }
        }
      })
      .catch(() => undefined)
      .finally(() => { if (active) setPreferencesReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Auto-abrir com relatório diário
  useEffect(() => {
    if (!shouldAutoOpen || !dailyReport || hasInjectedReport.current) return;
    hasInjectedReport.current = true;

    const reportMsg: ChatMessage = { role: "assistant", content: dailyReport };
    setMessages((prev) => {
      if (prev.length > 0) return [reportMsg, ...prev];
      return [reportMsg];
    });
    setIsOpen(true);
    onAutoOpened?.();
  }, [shouldAutoOpen, dailyReport, onAutoOpened]);

  const sendToAI = useCallback(
    async (text: string, currentMessages: ChatMessage[]) => {
      setIsLoading(true);
      try {
        const history = currentMessages.map((m) => ({ role: m.role, content: m.content }));
        const pageContext = usePageContext && snapshot ? snapshot.data : undefined;
        const result = await geminiChat(text, history, undefined, pageContext);
        const aiMsg: ChatMessage = { role: "assistant", content: result.response };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Erro desconhecido";
        setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ Erro: ${errMsg}` }]);
      } finally {
        setIsLoading(false);
      }
    },
    [usePageContext, snapshot],
  );

  const handleSend = async (text: string) => {
    const userMsg: ChatMessage = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    await sendToAI(text, updated.slice(0, -1));
  };

  /** Executa ação da AI e envia feedback para continuar conversa */
  const handleExecuteAction = useCallback(
    async (action: AiAction) => {
      const result = await executeAiAction(action);

      // Feedback como mensagem do "usuário" para a AI continuar
      const feedbackText = `✅ Ação executada com sucesso: ${result.message}. Continue a análise.`;
      const feedbackMsg: ChatMessage = { role: "user", content: feedbackText };
      setMessages((prev) => {
        const updated = [...prev, feedbackMsg];
        // Enviar para AI processar automaticamente
        sendToAI(feedbackText, updated.slice(0, -1));
        return updated;
      });
    },
    [sendToAI],
  );

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    if (getCookie("access_token") && !isImportDemo()) {
      void updateUserPreferences({ chatHistory: [] }).catch(() => undefined);
    }
  };

  return (
    <div className="hidden md:block">
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[400px] h-[560px] rounded-2xl border border-border/60 bg-background shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-blue-500/10 p-1.5">
                <RiMessageAi3Line className="size-4 text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">LOMUSTRACK AI</h3>
                <p className="text-[10px] text-muted-foreground">Assistente Inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ReportIntervalSettings />
              <button
                onClick={handleClear}
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Limpar conversa"
              >
                <RiDeleteBinLine className="size-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Fechar"
              >
                <RiCloseLine className="size-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ChatMessages
            messages={messages}
            isLoading={isLoading || !!dailyReportLoading}
            messagesEndRef={messagesEndRef}
            onExecuteAction={handleExecuteAction}
            onSend={handleSend}
          />

          {/* Page Data Toggle + Input */}
          <PageDataToggle
            snapshot={snapshot}
            enabled={usePageContext}
            onToggle={setUsePageContext}
          />
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      )}

      {/* Floating Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 rounded-full p-3.5 bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 group"
        title={isOpen ? "Fechar assistente" : "Abrir assistente AI"}
      >
        {isOpen ? (
          <RiCloseLine className="size-6 transition-transform" />
        ) : (
          <RiMessageAi3Line className="size-6 group-hover:rotate-12 transition-transform" />
        )}
      </button>
    </div>
  );
}
