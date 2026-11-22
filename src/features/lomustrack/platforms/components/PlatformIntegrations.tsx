import { useEffect, useState } from "react";
import { RiDeleteBinLine, RiFileCopyLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/services/api";

interface ApiCredential {
  id: number;
  name: string;
  token?: string;
  token_prefix?: string;
  created_at?: string;
  last_used_at?: string | null;
  active: boolean;
}

function CredentialModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (input: { name: string }) => Promise<ApiCredential>;
}) {
  const [name, setName] = useState("");
  const [created, setCreated] = useState<ApiCredential | null>(null);
  const [copied, setCopied] = useState(false);

  const close = (value: boolean) => {
    if (!value) {
      setName("");
      setCreated(null);
      setCopied(false);
    }
    onOpenChange(value);
  };

  const create = async () => {
    if (!name.trim()) return;
    const credential = await onCreated({ name: name.trim() });
    setCreated(credential);
  };

  const copy = async () => {
    if (!created?.token) return;
    await navigator.clipboard.writeText(created.token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        {!created ? (
          <>
            <DialogHeader>
              <DialogTitle>Criar Credencial de API</DialogTitle>
              <DialogDescription>
                Use esta credencial para integrar outras ferramentas ao LomusTrack.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="credential-name">Nome</Label>
              <Input
                id="credential-name"
                placeholder="Nome da Credencial"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="off"
              />
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={!name.trim()} className="w-full">
                Criar Credencial
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Credencial criada com sucesso <span aria-label="sucesso">✅</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">ATENÇÃO!</p>
                <p className="mt-3">
                  O token abaixo só ficará visível neste momento.
                  <br />
                  Salve-o em um lugar seguro:
                </p>
              </div>
              <div className="space-y-2">
                <Label>API Token</Label>
                <div className="flex gap-2">
                  <Input value={created.token} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={copy} title="Copiar token">
                    <RiFileCopyLine className="size-4" />
                  </Button>
                </div>
                {copied && <p className="text-xs text-emerald-600">Token copiado.</p>}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => close(false)} className="w-full">
                Finalizar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PlatformIntegrations({
  onDeleteCredential,
}: {
  onDeleteCredential?: (id: string) => void;
}) {
  const [credentialOpen, setCredentialOpen] = useState(false);
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<ApiCredential[]>("/platforms/credentials")
      .then(setCredentials)
      .catch(() => setCredentials([]))
      .finally(() => setLoading(false));
  }, []);

  const createCredential = async (input: { name: string }) => {
    const created = await apiRequest<ApiCredential>("/platforms/credentials", {
      method: "POST",
      body: { name: input.name },
    });
    setCredentials((current) => [created, ...current]);
    return created;
  };
  const deleteCredential = async (id: number) => {
    await apiRequest(`/platforms/credentials/${id}`, { method: "DELETE" });
    setCredentials((current) => current.filter((credential) => credential.id !== id));
    onDeleteCredential?.(String(id));
  };

  return (
    <>
      <Card className="bg-card border-border/40">
        <CardContent className="p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold mb-1.5">Credenciais de API</h3>
            <p className="text-sm text-muted-foreground">
              Adicione credenciais de API para integrar com outras ferramentas:
            </p>
          </div>

          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {!loading && credentials.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">
              Nenhuma credencial criada ainda.
            </p>
          )}

          {!loading && credentials.length > 0 && (
            <div className="space-y-2">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className="flex items-start justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3 gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-0.5">{credential.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Status: {credential.active ? "Ativado" : "Desativado"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void deleteCredential(credential.id)}
                    title="Excluir credencial"
                    className="h-7 w-7"
                  >
                    <RiDeleteBinLine className="size-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button onClick={() => setCredentialOpen(true)} className="w-full">
            Adicionar Credencial
          </Button>
        </CardContent>
      </Card>
      <CredentialModal
        open={credentialOpen}
        onOpenChange={setCredentialOpen}
        onCreated={createCredential}
      />
    </>
  );
}
