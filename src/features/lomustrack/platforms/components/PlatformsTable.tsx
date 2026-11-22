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
    <Card className="bg-[#1e2533] border-[#2c3648] rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#2a3344]">
        <RiRadioButtonLine className="size-4 text-[#64748b]" />
        <h3 className="text-[15px] font-semibold text-[#e5e7eb]">Webhooks</h3>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <p className="text-[13.5px] leading-relaxed text-[#cbd5e1]">
          Adicione webhooks para se conectar com as plataformas de venda:
        </p>

        {isLoading && <TableSkeleton />}

        {!isLoading && endpoints.length > 0 && (
          <div className="space-y-2">
            {endpoints.map((ep) => (
              <div
                key={ep.id}
                className="flex items-start justify-between rounded-md border border-[#374151] bg-[#1b212e] px-4 py-3 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-[13.5px] text-[#e2e8f0]">{ep.name}</p>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium border-[#374151] gap-1 px-1.5 py-0"
                    >
                      <PlatformLogo platform={ep.platform as "kiwify" | "payt" | "hotmart" | "api"} size="sm" />
                    </Badge>
                  </div>
                  <code className="text-[12px] text-[#94a3b8] font-mono block truncate">
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
                    className="h-7 w-7 text-[#94a3b8] hover:text-[#cbd5e1]"
                  >
                    <RiFileCopyLine className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(ep)}
                    title="Excluir webhook"
                    className="h-7 w-7 text-[#94a3b8] hover:text-[#ef4444]"
                  >
                    <RiDeleteBinLine className="size-3.5" />
                  </Button>
                </div>
                {copiedId === ep.id && (
                  <span className="absolute text-[10px] text-emerald-400 mt-16">Copiado!</span>
                )}
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={onCreateNew}
          className="w-full bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-semibold text-[13.5px] px-[18px] py-[10px] rounded-md h-auto"
        >
          Adicionar Webhook
        </Button>
      </div>
    </Card>
  );
}
