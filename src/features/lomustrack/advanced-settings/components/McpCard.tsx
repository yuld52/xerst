import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  RiCpuLine,
  RiFileCopyLine,
  RiCheckLine,
  RiRefreshLine,
  RiCodeSSlashLine,
  RiTerminalBoxLine,
} from "@remixicon/react";
import { toast } from "sonner";
import { apiRequest } from "@/services/api";
import { isImportDemo } from "@/lib/import-demo";

const STORAGE_KEY = "lomus_mcp_config";

interface McpConfig {
  enabled: boolean;
  apiKey: string;
}

function generateApiKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let random = "";
  for (let i = 0; i < 32; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `mcp_live_${random}`;
}

export function McpCard() {
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [origin, setOrigin] = useState("http://localhost:8080");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);

      if (isImportDemo()) {
        // Demo mode: use localStorage only
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved) as McpConfig;
            setEnabled(parsed.enabled ?? false);
            setApiKey(parsed.apiKey || generateApiKey());
          } else {
            setApiKey(generateApiKey());
          }
        } catch {
          setApiKey(generateApiKey());
        }
      } else {
        // Production: load from API, fall back to localStorage on error
        apiRequest<{ enabled: boolean; api_key: string | null }>("/advanced-settings/mcp")
          .then((data) => {
            setEnabled(data.enabled);
            setApiKey(data.api_key || "");
          })
          .catch(() => {
            try {
              const saved = localStorage.getItem(STORAGE_KEY);
              if (saved) {
                const parsed = JSON.parse(saved) as McpConfig;
                setEnabled(parsed.enabled ?? false);
                setApiKey(parsed.apiKey || generateApiKey());
              } else {
                setApiKey(generateApiKey());
              }
            } catch {
              setApiKey(generateApiKey());
            }
          });
      }
    }
  }, []);

  const saveConfig = (nextEnabled: boolean, nextKey: string) => {
    setEnabled(nextEnabled);
    setApiKey(nextKey);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ enabled: nextEnabled, apiKey: nextKey }),
      );
    } catch {
      // ignore
    }
  };

  const handleToggle = (checked: boolean) => {
    if (isImportDemo()) {
      saveConfig(checked, apiKey || generateApiKey());
      if (checked) {
        toast.success("Servidor MCP habilitado para agentes de IA");
      } else {
        toast.info("Servidor MCP desabilitado");
      }
      return;
    }

    apiRequest<{ enabled: boolean; api_key: string | null }>("/advanced-settings/mcp", {
      method: "PUT",
      body: { enabled: checked },
    })
      .then((data) => {
        setEnabled(data.enabled);
        setApiKey(data.api_key || "");
        if (data.enabled) {
          toast.success("Servidor MCP habilitado para agentes de IA");
        } else {
          toast.info("Servidor MCP desabilitado");
        }
      })
      .catch(() => {
        saveConfig(checked, apiKey || generateApiKey());
        if (checked) {
          toast.success("Servidor MCP habilitado para agentes de IA");
        } else {
          toast.info("Servidor MCP desabilitado");
        }
      });
  };

  const handleRegenerateKey = () => {
    if (isImportDemo()) {
      const newKey = generateApiKey();
      saveConfig(enabled, newKey);
      toast.success("Nova chave de API gerada com sucesso");
      return;
    }

    apiRequest<{ enabled: boolean; api_key: string | null }>("/advanced-settings/mcp/regenerate", {
      method: "POST",
    })
      .then((data) => {
        setEnabled(data.enabled);
        setApiKey(data.api_key || "");
        toast.success("Nova chave de API gerada com sucesso");
      })
      .catch(() => {
        const newKey = generateApiKey();
        saveConfig(enabled, newKey);
        toast.success("Nova chave de API gerada com sucesso");
      });
  };

  const endpointUrl = `${origin}/api/mcp`;

  const clientConfigJson = JSON.stringify(
    {
      mcpServers: {
        lomustrack: {
          url: endpointUrl,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2,
  );

  const copyToClipboard = async (
    text: string,
    setCopied: (v: boolean) => void,
    label: string,
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copiado!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  return (
    <Card className="border-border/50 lg:col-span-2">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <RiCpuLine className="size-5 text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Model Context Protocol (MCP)</CardTitle>
                <Badge
                  variant={enabled ? "default" : "secondary"}
                  className={
                    enabled
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]"
                      : "text-[10px]"
                  }
                >
                  {enabled ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Conecte assistentes de IA (Cursor, Claude, Antigravity) diretamente aos dados do LomusTrack
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
          <div className="space-y-0.5">
            <Label htmlFor="mcp-toggle" className="text-sm font-medium cursor-pointer">
              Habilitar servidor MCP
            </Label>
            <p className="text-xs text-muted-foreground">
              Permite que agentes externos consultem métricas, vendas e campanhas em tempo real
            </p>
          </div>
          <Switch id="mcp-toggle" checked={enabled} onCheckedChange={handleToggle} />
        </div>

        {enabled && (
          <div className="space-y-4 pt-1 animate-in fade-in-50 duration-200">
            {/* Endpoint URL & Token */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Endpoint MCP (Streamable HTTP)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={endpointUrl}
                    className="font-mono text-xs bg-muted/40 h-9"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-9 shrink-0"
                    onClick={() => copyToClipboard(endpointUrl, setCopiedUrl, "Endpoint")}
                    title="Copiar URL do Endpoint"
                  >
                    {copiedUrl ? (
                      <RiCheckLine className="size-4 text-emerald-500" />
                    ) : (
                      <RiFileCopyLine className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">Chave de Acesso (API Key)</Label>
                  <button
                    type="button"
                    onClick={handleRegenerateKey}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <RiRefreshLine className="size-3" /> Regerar
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    type="password"
                    value={apiKey}
                    className="font-mono text-xs bg-muted/40 h-9"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-9 shrink-0"
                    onClick={() => copyToClipboard(apiKey, setCopiedKey, "Token")}
                    title="Copiar Chave de Acesso"
                  >
                    {copiedKey ? (
                      <RiCheckLine className="size-4 text-emerald-500" />
                    ) : (
                      <RiFileCopyLine className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Configuração JSON para clientes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <RiCodeSSlashLine className="size-3.5" />
                  Configuração para Clientes (mcp_config.json / claude_desktop_config.json)
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => copyToClipboard(clientConfigJson, setCopiedJson, "JSON de configuração")}
                >
                  {copiedJson ? (
                    <>
                      <RiCheckLine className="size-3.5 text-emerald-500" /> Copiado
                    </>
                  ) : (
                    <>
                      <RiFileCopyLine className="size-3.5" /> Copiar JSON
                    </>
                  )}
                </Button>
              </div>
              <pre className="rounded-lg border border-border/50 bg-muted/30 p-3 text-[11px] font-mono overflow-x-auto text-muted-foreground">
                {clientConfigJson}
              </pre>
            </div>

            {/* Ferramentas expostas */}
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <RiTerminalBoxLine className="size-3.5 text-primary" />
                <span>Ferramentas (Tools) disponíveis para a IA:</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline" className="font-mono text-[11px] bg-background/80">
                  get_metrics
                  <span className="text-muted-foreground ml-1.5 font-sans text-[10px]">
                    (Faturamento, Lucro, ROAS)
                  </span>
                </Badge>
                <Badge variant="outline" className="font-mono text-[11px] bg-background/80">
                  get_sales
                  <span className="text-muted-foreground ml-1.5 font-sans text-[10px]">
                    (Vendas e pedidos)
                  </span>
                </Badge>
                <Badge variant="outline" className="font-mono text-[11px] bg-background/80">
                  list_campaigns
                  <span className="text-muted-foreground ml-1.5 font-sans text-[10px]">
                    (Campanhas de anúncios)
                  </span>
                </Badge>
                <Badge variant="outline" className="font-mono text-[11px] bg-background/80">
                  list_products
                  <span className="text-muted-foreground ml-1.5 font-sans text-[10px]">
                    (Produtos e estoque)
                  </span>
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
