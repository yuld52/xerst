import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RiSearchLine, RiCloseLine, RiArrowLeftLine } from "@remixicon/react";

interface CreateWebhookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (platform: string, name: string, securityToken?: string) => Promise<void>;
  isLoading?: boolean;
}

// Only platforms with actual backend webhook parsers
const PLATFORMS = [
  { 
    value: "hotmart", 
    label: "Hotmart", 
    description: "Integração nativa com autenticação Hottok",
    requiresToken: true,
  },
  { 
    value: "api", 
    label: "API Genérica", 
    description: "Para qualquer plataforma via credencial API",
    requiresToken: false,
  },
];

export function CreateWebhookModal({
  open,
  onOpenChange,
  onCreate,
  isLoading,
}: CreateWebhookModalProps) {
  const [search, setSearch] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<typeof PLATFORMS[number] | null>(null);
  const [webhookName, setWebhookName] = useState("");
  const [securityToken, setSecurityToken] = useState("");

  const filteredPlatforms = PLATFORMS.filter((p) =>
    p.label.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const handlePlatformSelect = (platform: typeof PLATFORMS[number]) => {
    setSelectedPlatform(platform);
    setWebhookName(`Webhook ${platform.label}`);
  };

  const handleCreate = async () => {
    if (!selectedPlatform || !webhookName.trim()) return;
    
    try {
      await onCreate(
        selectedPlatform.value,
        webhookName.trim(),
        selectedPlatform.requiresToken ? securityToken : undefined
      );
      handleClose();
    } catch {
      // Keep modal open on error
    }
  };

  const handleBack = () => {
    setSelectedPlatform(null);
    setWebhookName("");
    setSecurityToken("");
  };

  const handleClose = () => {
    setSearch("");
    setSelectedPlatform(null);
    setWebhookName("");
    setSecurityToken("");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90%] md:w-[60%] lg:w-[30%] p-0 overflow-hidden flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedPlatform && (
                <button
                  onClick={handleBack}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                >
                  <RiArrowLeftLine className="h-5 w-5" />
                </button>
              )}
              <SheetTitle>
                {selectedPlatform ? `Webhook ${selectedPlatform.label}` : "Webhooks"}
              </SheetTitle>
            </div>
            <button
              onClick={handleClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <RiCloseLine className="h-5 w-5" />
            </button>
          </div>
        </SheetHeader>

        {!selectedPlatform ? (
          // Step 1: Select Platform
          <div className="flex-1 overflow-hidden flex flex-col px-6">
            <div className="flex-none py-4">
              <p className="text-sm text-muted-foreground mb-3">
                Selecione uma plataforma para começar:
              </p>
              <div className="relative">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por plataforma"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2 pb-4">
                {filteredPlatforms.map((platform) => (
                  <button
                    key={platform.value}
                    onClick={() => handlePlatformSelect(platform)}
                    disabled={isLoading}
                    className="w-full px-4 py-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors text-left disabled:opacity-50 group"
                  >
                    <div className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                      {platform.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {platform.description}
                    </div>
                  </button>
                ))}
              </div>
              {filteredPlatforms.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma plataforma encontrada
                </p>
              )}
            </div>
          </div>
        ) : (
          // Step 2: Configure Webhook
          <div className="flex-1 overflow-hidden flex flex-col px-6">
            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-name">Nome do Webhook</Label>
                  <Input
                    id="webhook-name"
                    placeholder="Ex: Webhook Hotmart Principal"
                    value={webhookName}
                    onChange={(e) => setWebhookName(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Dê um nome para identificar este webhook
                  </p>
                </div>

                {selectedPlatform.requiresToken && (
                  <div className="space-y-2">
                    <Label htmlFor="security-token">Hottok (Token de Segurança)</Label>
                    <Input
                      id="security-token"
                      type="password"
                      placeholder="Cole aqui o Hottok da Hotmart"
                      value={securityToken}
                      onChange={(e) => setSecurityToken(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Token de autenticação fornecido pela Hotmart
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-none border-t p-4">
              <Button
                onClick={handleCreate}
                disabled={!webhookName.trim() || (selectedPlatform.requiresToken && !securityToken.trim()) || isLoading}
                className="w-full"
              >
                {isLoading ? "Criando..." : "Criar Webhook"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
