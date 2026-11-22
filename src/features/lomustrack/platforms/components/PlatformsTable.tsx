import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RiFileCopyLine, RiDeleteBinLine, RiRadioButtonLine, RiMoreVerticalLine } from "@remixicon/react";
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
    <div className="space-y-2">
      <Skeleton className="h-16 w-full" />
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
    <Card className="rounded-lg border-border/40">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/40">
        <h4 className="text-base font-semibold">Webhooks</h4>
        <RiRadioButtonLine className="size-5 text-muted-foreground mb-[1px]" />
      </div>

      {/* Body */}
      <div className="pt-2 pb-0 px-5 space-y-6">
        <p className="text-sm text-muted-foreground">
          Adicione webhooks para se conectar com as plataformas de venda:
        </p>

        {isLoading && <TableSkeleton />}

        {!isLoading && endpoints.length > 0 && (
          <div className="space-y-5">
            {endpoints.map((ep) => (
              <div
                key={ep.id}
                className="flex items-start justify-between rounded-md border border-border px-4 py-3 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{ep.name}</p>
                    <Badge variant="outline" className="text-[10px] font-medium gap-1 px-1.5 py-0">
                      <PlatformLogo platform={ep.platform as "kiwify" | "payt" | "hotmart" | "api"} size="sm" />
                    </Badge>
                  </div>
                  <code className="text-xs text-muted-foreground font-mono block truncate">
                    {window.location.origin}
                    {buildWebhookUrl(ep)}
                  </code>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon-sm" onClick={() => handleCopy(ep)} title="Copiar URL" className="h-7 w-7 hover:bg-transparent">
                    <RiFileCopyLine className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => onDelete(ep)} title="Excluir webhook" className="h-7 w-7 text-destructive hover:bg-transparent">
                    <RiDeleteBinLine className="size-3.5" />
                  </Button>
                </div>
                {copiedId === ep.id && (
                  <span className="absolute text-[10px] text-emerald-500 mt-16">Copiado!</span>
                )}
              </div>
            ))}
          </div>
        )}

        <Button onClick={onCreateNew} className="w-full mb-6">
          Adicionar Webhook
        </Button>
      </div>
    </Card>
  );
}
