import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-3">
      {[1, 2].map((i) => (
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
    <Card className="bg-card border-border/40">
      <CardContent className="p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold mb-1.5">Webhooks</h3>
          <p className="text-sm text-muted-foreground">
            Adicione webhooks para se conectar com as plataformas de venda:
          </p>
        </div>

        {isLoading && <TableSkeleton />}

        {!isLoading && endpoints.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            Nenhum webhook criado ainda.
          </p>
        )}

        {!isLoading && endpoints.length > 0 && (
          <div className="space-y-2">
            {endpoints.map((ep) => (
              <div
                key={ep.id}
                className="flex items-start justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{ep.name}</p>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium border-border/50 gap-1 px-1.5 py-0"
                    >
                      <PlatformLogo platform={ep.platform as "kiwify" | "payt" | "hotmart" | "api"} size="sm" />
                    </Badge>
                  </div>
                  <code className="text-xs text-muted-foreground font-mono block truncate">
                    {window.location.origin}
                    {buildWebhookUrl(ep)}
                  </code>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleCopy(ep)}
                    title="Copiar URL"
                    className="h-7 w-7"
                  >
                    <RiFileCopyLine className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(ep)}
                    title="Excluir webhook"
                    className="h-7 w-7"
                  >
                    <RiDeleteBinLine className="size-3.5 text-destructive" />
                  </Button>
                </div>
                {copiedId === ep.id && (
                  <span className="absolute text-[10px] text-emerald-600 mt-16">Copiado!</span>
                )}
              </div>
            ))}
          </div>
        )}

        <Button onClick={onCreateNew} className="w-full">
          Adicionar Webhook
        </Button>
      </CardContent>
    </Card>
  );
}
