import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RiFileCopyLine, RiDeleteBinLine, RiWebhookLine } from "@remixicon/react";
import { useState } from "react";
import type { WebhookEndpointAPI } from "@/services/integrations";
import { PlatformLogo } from "@/components/PlatformLogo";

interface PlatformsTableProps {
  endpoints: WebhookEndpointAPI[];
  isLoading: boolean;
  onDelete: (endpoint: WebhookEndpointAPI) => void;
  onCreateNew: () => void;
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

function buildWebhookUrl(endpoint: WebhookEndpointAPI): string {
  return `/api/webhook/${endpoint.platform}/${endpoint.slug}`;
}

export function PlatformsTable({ endpoints, isLoading, onDelete, onCreateNew }: PlatformsTableProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (endpoint: WebhookEndpointAPI) => {
    const url = `${window.location.origin}${buildWebhookUrl(endpoint)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(endpoint.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="border-b py-5">
        <CardTitle className="flex items-center gap-2 text-lg">
          <RiWebhookLine className="size-5" />
          Webhooks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <p className="text-sm text-muted-foreground">
          Adicione webhooks para se conectar com as plataformas de venda:
        </p>

        {isLoading && <TableSkeleton />}

        {!isLoading && endpoints.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum webhook criado ainda.
          </p>
        )}

        {!isLoading && endpoints.length > 0 && (
          <div className="space-y-2">
            {endpoints.map((ep) => (
              <div
                key={ep.id}
                className="flex items-center justify-between rounded-md border px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{ep.name}</p>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium border border-border/50 gap-1 px-2 py-0.5"
                    >
                      <PlatformLogo platform={ep.platform as "kiwify" | "payt" | "hotmart" | "api"} size="sm" />
                    </Badge>
                  </div>
                  <code className="text-xs text-muted-foreground font-mono">
                    {window.location.origin}
                    {buildWebhookUrl(ep)}
                  </code>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(ep)}
                    title="Copiar URL"
                  >
                    <RiFileCopyLine className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(ep)}
                    title="Excluir webhook"
                  >
                    <RiDeleteBinLine className="size-4 text-destructive" />
                  </Button>
                </div>
                {copiedId === ep.id && (
                  <p className="absolute text-[10px] text-emerald-600 mt-14 ml-4">Copiado!</p>
                )}
              </div>
            ))}
          </div>
        )}

        <Button onClick={onCreateNew} className="gap-1.5">
          <RiWebhookLine className="size-4" />
          Adicionar Webhook
        </Button>
      </CardContent>
    </Card>
  );
}
